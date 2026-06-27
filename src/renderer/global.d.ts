export {};

declare global {
  interface Window {
    electronAPI: {
      newProject: () => Promise<{ success: boolean }>;
      saveProject: (data: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      saveProjectAs: (data: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      openProject: () => Promise<{ success: boolean; data?: any; filePath?: string; error?: string }>;
      openProjectByPath: (filePath: string) => Promise<{ success: boolean; data?: any; filePath?: string; error?: string }>;
      getCurrentFilePath: () => Promise<string | null>;
      setUnsavedChanges: (hasChanges: boolean) => void;
      setTitleBarTheme: (theme: string) => void;
      onOpenFile: (callback: (filePath: string) => void) => void;
      onBeforeClose: (callback: () => Promise<any>) => void;
      onMenuAction: (callback: (action: string) => void) => () => void;
    };
    reports: {
      exportPDF: (opts: {
        title?: string;
        data: any;
        printOptions?: Electron.PrintToPDFOptions;
        save?: boolean;
      }) => Promise<Uint8Array>;
    };
    electronSend: (channel: string, payload: any) => void;
  }
}
