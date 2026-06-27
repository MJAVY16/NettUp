import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import * as path from 'path';
import * as fs from 'fs';

let currentFilePath: string | null = null;
let mainWindow: BrowserWindow | null = null;
let hasUnsavedChanges: boolean = false;
// When true, the window is waiting on an in-flight save before it closes.
let pendingClose: boolean = false;
// A project file passed on the command line (double-click) awaiting the renderer.
let pendingOpenFile: string | null = null;

// Finds a project file path among CLI args (e.g. from double-clicking a .nettup).
function fileFromArgv(argv: string[]): string | null {
  const arg = argv.find(a => /\.(nettup|json)$/i.test(a) && fs.existsSync(a));
  return arg || null;
}

// Hands an externally-opened file to the renderer (or queues it until ready).
function openExternalFile(filePath: string) {
  if (mainWindow && !mainWindow.webContents.isLoading()) {
    mainWindow.webContents.send('open-file', filePath);
  } else {
    pendingOpenFile = filePath;
  }
}

const MAX_BACKUPS_PER_FILE = 10;

// Native window-control overlay colors per theme. `color` is the title-bar
// background (matched to each theme's header), `symbolColor` the button glyphs.
const TITLE_BAR_HEIGHT = 44;
const TITLE_BAR_OVERLAYS: Record<string, { color: string; symbolColor: string }> = {
  spy: { color: '#0d1117', symbolColor: '#c9d1d9' },
  dark: { color: '#16213e', symbolColor: '#e6e6e6' },
  light: { color: '#ffffff', symbolColor: '#2d3436' }
};
// Window background per theme, used before the renderer paints to avoid a
// mismatched flash (e.g. a dark frame on the light theme).
const THEME_BACKGROUNDS: Record<string, string> = {
  spy: '#0a0e14',
  dark: '#1a1a2e',
  light: '#f5f6fa'
};
const DEFAULT_THEME = 'light';

// Persisted UI theme so the window chrome (overlay + background) can match it
// from the very first frame, before the renderer loads.
const settingsStore = new Store<{ theme?: string }>({ name: 'settings' }) as Store<{ theme?: string }> & {
  get(key: 'theme'): string | undefined;
  set(key: 'theme', value: string): void;
};

function storedTheme(): string {
  return settingsStore.get('theme') || DEFAULT_THEME;
}

// Default location for user project files: Documents\NettUp (created on demand).
// Never the install directory — that's read-only under UAC and wiped on update.
function defaultProjectsDir(): string {
  const dir = path.join(app.getPath('documents'), 'NettUp');
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    return app.getPath('documents');
  }
  return dir;
}

function overlayForTheme(theme?: string) {
  return {
    ...(TITLE_BAR_OVERLAYS[theme || DEFAULT_THEME] || TITLE_BAR_OVERLAYS[DEFAULT_THEME]),
    height: TITLE_BAR_HEIGHT
  };
}

function backgroundForTheme(theme?: string): string {
  return THEME_BACKGROUNDS[theme || DEFAULT_THEME] || THEME_BACKGROUNDS[DEFAULT_THEME];
}

/**
 * Writes a file atomically: data is written to a temporary sibling file and
 * then renamed over the destination. A crash mid-write can corrupt the temp
 * file but never the real project file. rename() replaces the existing file
 * on Windows, macOS and Linux when both paths are on the same volume.
 */
function atomicWriteFileSync(filePath: string, content: string): void {
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, filePath);
}

/**
 * Copies the current on-disk project file into the userData backups folder
 * before it gets overwritten, keeping the most recent MAX_BACKUPS_PER_FILE
 * copies per project name. Backup failures are logged but never block a save.
 */
function backupExistingFile(filePath: string): void {
  try {
    if (!fs.existsSync(filePath)) return;

    const backupDir = path.join(app.getPath('userData'), 'backups');
    fs.mkdirSync(backupDir, { recursive: true });

    const base = path.basename(filePath, '.json');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(filePath, path.join(backupDir, `${base}_${stamp}.json`));

    // Prune older backups for this project, newest first.
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith(`${base}_`) && f.endsWith('.json'))
      .sort()
      .reverse();
    for (const stale of backups.slice(MAX_BACKUPS_PER_FILE)) {
      fs.unlinkSync(path.join(backupDir, stale));
    }
  } catch (error) {
    console.error('[MAIN] Backup failed (continuing with save):', error);
  }
}

/**
 * Writes project data to disk safely: backs up the existing file, then writes
 * the new contents atomically.
 */
function writeProjectFile(filePath: string, data: any): void {
  backupExistingFile(filePath);
  atomicWriteFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Validates that parsed JSON looks like a Financial Tracker project.
 * Returns a human-readable error message, or null if the data is acceptable.
 */
function validateProjectData(data: any): string | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return 'This file is not a valid Financial Tracker project.';
  }

  const knownFields = ['incomes', 'debts', 'expenses', 'budgets', 'savingsGoals', 'settings', 'name'];
  if (!knownFields.some(field => field in data)) {
    return 'This file does not appear to be a Financial Tracker project.';
  }

  for (const field of ['incomes', 'debts', 'expenses', 'budgets', 'savingsGoals', 'milestones', 'logs']) {
    if (field in data && !Array.isArray(data[field])) {
      return `This project file is corrupted: "${field}" should be a list.`;
    }
  }

  return null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icons/win/icon.ico'),
    // Hide the native title bar but keep the OS window controls as an overlay,
    // themed to match the app. The File menu lives in the in-app header now;
    // the application menu below is kept solely for keyboard accelerators.
    titleBarStyle: 'hidden',
    titleBarOverlay: overlayForTheme(storedTheme()),
    backgroundColor: backgroundForTheme(storedTheme()),
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }

  // Forward renderer console logs to main process terminal
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const levelMap = ['[VERBOSE]', '[INFO]', '[WARNING]', '[ERROR]'];
    console.log(`[RENDERER] ${levelMap[level] || '[LOG]'} ${message}`);
  });

  // Once the renderer is ready, hand it any file opened via double-click.
  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingOpenFile) {
      mainWindow?.webContents.send('open-file', pendingOpenFile);
      pendingOpenFile = null;
    }
  });

  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu-new')
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu-open')
        },
        {
          label: 'Save Project',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu-save')
        },
        {
          label: 'Save Project As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu-save-as')
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);

  // Handle window close with unsaved changes check
  mainWindow.on('close', async (event) => {
    // pendingClose means a save kicked off by this flow has completed and we
    // are now closing for real — let it through.
    if (!hasUnsavedChanges || pendingClose) {
      return;
    }

    event.preventDefault();

    const result = await dialog.showMessageBox(mainWindow!, {
      type: 'warning',
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Do you want to save before closing?',
      buttons: ['Save', "Don't Save", 'Cancel'],
      defaultId: 0,
      cancelId: 2
    });

    if (result.response === 0) {
      // Save: ask the renderer to save, and only close once the save handler
      // confirms it finished (see finishPendingClose). No fixed timeout, so a
      // slow disk can never truncate the write.
      console.log('[MAIN] User chose to save before closing');
      pendingClose = true;
      mainWindow?.webContents.send('menu-save');
    } else if (result.response === 1) {
      // Don't Save
      console.log('[MAIN] User chose not to save, closing');
      hasUnsavedChanges = false;
      pendingClose = true;
      mainWindow?.close();
    }
    // Cancel - do nothing, window stays open
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Wires up auto-updates against the GitHub Releases feed configured in
 * package.json `build.publish`. Only runs in a packaged build — in dev there is
 * no published feed, so checking would just error.
 *
 * On launch it checks for a newer release, downloads it in the background, and
 * once ready prompts the user to restart and install. The user's data is never
 * touched by the update (it lives in userData), so a restart is safe.
 */
function setupAutoUpdater() {
  if (!app.isPackaged) {
    console.log('[UPDATER] Skipping update check in development');
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => console.log('[UPDATER] Checking for updates...'));
  autoUpdater.on('update-available', (info) => console.log('[UPDATER] Update available:', info.version));
  autoUpdater.on('update-not-available', () => console.log('[UPDATER] App is up to date'));
  autoUpdater.on('error', (err) => console.error('[UPDATER] Update error:', err));
  autoUpdater.on('download-progress', (p) =>
    console.log(`[UPDATER] Downloading: ${Math.round(p.percent)}%`)
  );

  autoUpdater.on('update-downloaded', async (info) => {
    console.log('[UPDATER] Update downloaded:', info.version);
    if (!mainWindow) return;

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'Restart now to install it, or it will be applied the next time you close the app.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      // Allow the window to close even with the unsaved-changes guard.
      hasUnsavedChanges = false;
      pendingClose = true;
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.error('[UPDATER] Failed to check for updates:', err);
  });
}

// Single-instance: if a second copy is launched (e.g. double-clicking a file
// while the app is open), forward the file to the existing window instead.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const file = fileFromArgv(argv);
    if (file) openExternalFile(file);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    pendingOpenFile = fileFromArgv(process.argv);
    createWindow();
    setupAutoUpdater();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// New Project - Clear current file path
ipcMain.handle('new-project', async () => {
  console.log('[MAIN] New project requested');
  currentFilePath = null;
  console.log('[MAIN] Current file path cleared');
  return { success: true };
});

// Save Project - Use existing path or show Save As dialog
ipcMain.handle('save-project', async (_event, data: any) => {
  console.log('[MAIN] Save project requested');
  console.log('[MAIN] Current file path:', currentFilePath);

  if (currentFilePath) {
    // We have a path, save directly
    console.log('[MAIN] Saving to existing file:', currentFilePath);
    try {
      writeProjectFile(currentFilePath, data);
      console.log('[MAIN] File saved successfully');
      finishPendingClose(true);
      return { success: true, filePath: currentFilePath };
    } catch (error) {
      console.error('[MAIN] Error saving file:', error);
      finishPendingClose(false, String(error));
      return { success: false, error: String(error) };
    }
  } else {
    // No path, show Save As dialog
    console.log('[MAIN] No current file path, showing Save As dialog');
    return await handleSaveAs(data);
  }
});

// Save Project As - Always show dialog
ipcMain.handle('save-project-as', async (_event, data: any) => {
  console.log('[MAIN] Save As requested');
  return await handleSaveAs(data);
});

// Open Project - Show open dialog
ipcMain.handle('open-project', async () => {
  console.log('[MAIN] Open project requested');
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Open NettUp Project',
    defaultPath: defaultProjectsDir(),
    filters: [
      { name: 'NettUp Project', extensions: ['nettup', 'json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    console.log('[MAIN] Opening file:', filePath);
    return readProjectFile(filePath);
  }
  console.log('[MAIN] Open dialog canceled');
  return { success: false };
});

// Open Project by Path - Direct file opening (for recent projects)
ipcMain.handle('open-project-by-path', async (_event, filePath: string) => {
  console.log('[MAIN] Open project by path requested:', filePath);
  return readProjectFile(filePath);
});

// Get current file path
ipcMain.handle('get-current-file-path', () => {
  console.log('[MAIN] Current file path requested:', currentFilePath);
  return currentFilePath;
});

// Set unsaved changes status
ipcMain.on('set-unsaved-changes', (_event, hasChanges: boolean) => {
  hasUnsavedChanges = hasChanges;
  console.log('[MAIN] Unsaved changes status updated:', hasUnsavedChanges);
});

// Sync the native window-control overlay color with the active theme, and
// persist it so the window chrome matches from the first frame next launch.
ipcMain.on('window:set-theme-overlay', (_event, theme: string) => {
  settingsStore.set('theme', theme);
  if (!mainWindow) return;
  try {
    mainWindow.setTitleBarOverlay(overlayForTheme(theme));
  } catch (err) {
    // setTitleBarOverlay is only available with the Window Controls Overlay
    // (Windows/Linux). Safe to ignore on platforms that don't support it.
    console.error('[MAIN] setTitleBarOverlay failed:', err);
  }
});

// PDF Report Export
ipcMain.handle('reports:export', async (_event, opts: {
  title?: string;
  data: any;
  printOptions?: Electron.PrintToPDFOptions;
  save?: boolean;
}) => {
  const DEBUG_VISIBLE = false; // Set to true to debug the report window

  console.log('[MAIN] ========== PDF EXPORT STARTED ==========');
  console.log('[MAIN] PDF export requested:', opts.title);
  console.log('[MAIN] Data summary:', {
    incomes: opts.data?.incomes?.length || 0,
    debts: opts.data?.debts?.length || 0,
    expenses: opts.data?.expenses?.length || 0,
    budgets: opts.data?.budgets?.length || 0,
    hasSummary: !!opts.data?.summary
  });

  const reportWin = new BrowserWindow({
    show: DEBUG_VISIBLE,
    width: 1080,
    height: 1400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Forward console messages from report window
  reportWin.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const levelMap = ['[VERBOSE]', '[INFO]', '[WARNING]', '[ERROR]'];
    console.log(`[REPORT-WINDOW] ${levelMap[level] || '[LOG]'} ${message}`);
  });

  try {
    // Load the main app URL with #report hash
    const reportUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:8080/#report'
      : `file://${path.join(__dirname, 'index.html')}#report`;

    console.log('[MAIN] Loading report URL:', reportUrl);
    await reportWin.loadURL(reportUrl);
    console.log('[MAIN] Report URL loaded successfully');

    if (DEBUG_VISIBLE) {
      reportWin.webContents.openDevTools({ mode: 'detach' });
    }

    // 1) Wait for the report page to mount (component lifecycle)
    console.log('[MAIN] Waiting for report page to mount...');
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('[MAIN] TIMEOUT: Report page did not mount');
        ipcMain.removeListener('reports:mounted', handler);
        reject(new Error('Report page did not mount'));
      }, 15000);

      const handler = () => {
        console.log('[MAIN] Report page mounted!');
        clearTimeout(timeout);
        ipcMain.removeListener('reports:mounted', handler);
        resolve();
      };

      ipcMain.on('reports:mounted', handler);
    });

    // 2) Send data AFTER mounted to avoid races
    const payload = {
      title: opts.title || 'Financial Report',
      data: opts.data
    };

    console.log('[MAIN] Sending report data via IPC channel...');
    console.log('[MAIN] Payload size:', JSON.stringify(payload).length, 'characters');
    reportWin.webContents.send('reports:data', payload);
    console.log('[MAIN] Data sent to report page');

    // 3) Wait for the page to render and signal ready
    console.log('[MAIN] Waiting for report:ready signal...');
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('[MAIN] TIMEOUT: Report did not become ready in 20 seconds');
        ipcMain.removeListener('reports:ready', handler);
        reject(new Error('Report render timeout'));
      }, 20000);

      const handler = (_evt: any, msg: string) => {
        console.log('[MAIN] Received reports:ready event with message:', msg);
        if (msg === 'report:ready') {
          console.log('[MAIN] Report is ready!');
          clearTimeout(timeout);
          ipcMain.removeListener('reports:ready', handler);
          resolve();
        }
      };

      ipcMain.on('reports:ready', handler);
    });

    console.log('[MAIN] Report ready confirmed, generating PDF...');

    // Generate PDF
    const pdfBuffer = await reportWin.webContents.printToPDF({
      pageSize: 'Letter',
      printBackground: true,
      landscape: false,
      ...opts.printOptions
    });

    console.log('[MAIN] PDF buffer generated, size:', pdfBuffer.length, 'bytes');

    // Save if requested
    if (opts.save) {
      console.log('[MAIN] Showing save dialog...');
      const result = await dialog.showSaveDialog(mainWindow!, {
        title: payload.title,
        defaultPath: `${payload.title.replace(/[^\w.-]/g, '_')}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });

      if (result.filePath) {
        console.log('[MAIN] Saving PDF to:', result.filePath);
        fs.writeFileSync(result.filePath, pdfBuffer);
        console.log('[MAIN] PDF saved successfully');
      } else {
        console.log('[MAIN] Save dialog cancelled');
      }
    }

    // Cleanup
    if (!DEBUG_VISIBLE) {
      setImmediate(() => {
        if (!reportWin.isDestroyed()) {
          console.log('[MAIN] Closing report window');
          reportWin.close();
        }
      });
    }

    console.log('[MAIN] ========== PDF EXPORT COMPLETED ==========');
    return new Uint8Array(pdfBuffer);
  } catch (error) {
    console.error('[MAIN] ========== PDF EXPORT FAILED ==========');
    console.error('[MAIN] Error generating PDF:', error);
    console.error('[MAIN] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[MAIN] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[MAIN] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    if (!reportWin.isDestroyed()) {
      console.log('[MAIN] Closing report window after error');
      reportWin.close();
    }
    throw error;
  }
});

// Reads, parses, validates and migrates a project file from disk.
function readProjectFile(filePath: string) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error('[MAIN] File is not valid JSON:', filePath);
      return { success: false, error: 'This file is corrupted or not valid JSON and could not be opened.' };
    }

    const validationError = validateProjectData(parsed);
    if (validationError) {
      console.error('[MAIN] Project validation failed:', validationError);
      return { success: false, error: validationError };
    }

    const data = migrateProjectData(parsed);
    currentFilePath = filePath;
    console.log('[MAIN] File opened successfully, current path set to:', currentFilePath);
    return { success: true, data, filePath: currentFilePath };
  } catch (error) {
    console.error('[MAIN] Error opening file:', error);
    return { success: false, error: String(error) };
  }
}

// Resolves a save that was triggered by the window-close flow: closes the
// window on success, or cancels the close and warns the user on failure.
function finishPendingClose(saveSucceeded: boolean, errorMessage?: string) {
  if (!pendingClose) return;
  pendingClose = false;

  if (saveSucceeded) {
    hasUnsavedChanges = false;
    mainWindow?.close();
  } else if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Save Failed',
      message: 'Your changes could not be saved, so the application stayed open.',
      detail: errorMessage,
      buttons: ['OK']
    });
  }
}

// Helper function to migrate old projects
function migrateProjectData(data: any) {
  // Ensure logs array exists for backward compatibility
  if (!data.logs) {
    data.logs = [];
    console.log('[MAIN] Migrated old project: added logs array');
  }
  return data;
}

// Helper function for Save As
async function handleSaveAs(data: any) {
  const suggestedName = `${String(data?.name || 'My Finances').replace(/[^\w.-]+/g, ' ').trim() || 'My Finances'}.nettup`;
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: 'Save NettUp Project',
    defaultPath: currentFilePath || path.join(defaultProjectsDir(), suggestedName),
    filters: [
      { name: 'NettUp Project', extensions: ['nettup'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || !result.filePath) {
    console.log('[MAIN] Save As dialog canceled');
    // The user backed out of saving, so abandon any pending close too.
    pendingClose = false;
    return { success: false };
  }

  const savePath = result.filePath;
  console.log('[MAIN] Saving to:', savePath);
  try {
    writeProjectFile(savePath, data);
    currentFilePath = savePath;
    console.log('[MAIN] File saved successfully, current path set to:', currentFilePath);
    finishPendingClose(true);
    return { success: true, filePath: currentFilePath };
  } catch (error) {
    console.error('[MAIN] Error saving file:', error);
    finishPendingClose(false, String(error));
    return { success: false, error: String(error) };
  }
}
