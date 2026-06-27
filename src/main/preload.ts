import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  newProject: () => ipcRenderer.invoke('new-project'),
  saveProject: (data: any) => ipcRenderer.invoke('save-project', data),
  saveProjectAs: (data: any) => ipcRenderer.invoke('save-project-as', data),
  openProject: () => ipcRenderer.invoke('open-project'),
  openProjectByPath: (filePath: string) => ipcRenderer.invoke('open-project-by-path', filePath),
  getCurrentFilePath: () => ipcRenderer.invoke('get-current-file-path'),
  setUnsavedChanges: (hasChanges: boolean) => ipcRenderer.send('set-unsaved-changes', hasChanges),
  setTitleBarTheme: (theme: string) => ipcRenderer.send('window:set-theme-overlay', theme),
  onBeforeClose: (callback: () => Promise<any>) => {
    ipcRenderer.on('before-close', async () => {
      const result = await callback();
      ipcRenderer.send('before-close-response', result);
    });
  },
  onMenuAction: (callback: (action: string) => void) => {
    const handlers = {
      new: () => callback('new'),
      open: () => callback('open'),
      save: () => callback('save'),
      saveAs: () => callback('save-as')
    };

    ipcRenderer.on('menu-new', handlers.new);
    ipcRenderer.on('menu-open', handlers.open);
    ipcRenderer.on('menu-save', handlers.save);
    ipcRenderer.on('menu-save-as', handlers.saveAs);

    // Return cleanup function to remove listeners
    return () => {
      ipcRenderer.removeListener('menu-new', handlers.new);
      ipcRenderer.removeListener('menu-open', handlers.open);
      ipcRenderer.removeListener('menu-save', handlers.save);
      ipcRenderer.removeListener('menu-save-as', handlers.saveAs);
    };
  }
});

// PDF Reports API
contextBridge.exposeInMainWorld('reports', {
  exportPDF: (opts: {
    title?: string;
    data: any;
    printOptions?: Electron.PrintToPDFOptions;
    save?: boolean;
  }) => ipcRenderer.invoke('reports:export', opts)
});

// Main -> Report page: payload delivery
ipcRenderer.on('reports:data', (_e, payload) => {
  (globalThis as any).dispatchEvent(new CustomEvent('REPORT_DATA', { detail: payload }));
});

// Report page -> Main: lifecycle signals
contextBridge.exposeInMainWorld('reportSignal', {
  mounted: () => ipcRenderer.send('reports:mounted'),
  ready: () => ipcRenderer.send('reports:ready', 'report:ready')
});

// License Management API
contextBridge.exposeInMainWorld('licenseAPI', {
  checkStatus: () => ipcRenderer.invoke('license:check-status'),
  activate: (key: string) => ipcRenderer.invoke('license:activate', key),
  getInfo: () => ipcRenderer.invoke('license:get-info'),
  deactivate: () => ipcRenderer.invoke('license:deactivate'),
  getMachineId: () => ipcRenderer.invoke('license:get-machine-id'),
  validateFormat: (key: string) => ipcRenderer.invoke('license:validate-format', key)
});
