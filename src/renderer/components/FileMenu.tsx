import React, { useEffect, useRef, useState } from 'react';

interface FileMenuProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
}

interface MenuItem {
  label: string;
  shortcut: string;
  icon: string;
  action: () => void;
}

/**
 * Themed in-app File menu that replaces the native OS menu bar. Lives in the
 * draggable title bar header, so it is marked no-drag to stay clickable.
 */
const FileMenu: React.FC<FileMenuProps> = ({ onNew, onOpen, onSave, onSaveAs }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;

    const handlePointer = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const items: MenuItem[] = [
    { label: 'New Project', shortcut: 'Ctrl+N', icon: 'bi-file-earmark-plus', action: onNew },
    { label: 'Open Project', shortcut: 'Ctrl+O', icon: 'bi-folder2-open', action: onOpen },
    { label: 'Save Project', shortcut: 'Ctrl+S', icon: 'bi-save', action: onSave },
    { label: 'Save Project As…', shortcut: 'Ctrl+Shift+S', icon: 'bi-save2', action: onSaveAs },
  ];

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="file-menu" ref={containerRef}>
      <button
        className={`file-menu-trigger ${open ? 'active' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        File <i className="bi bi-caret-down-fill" style={{ fontSize: '0.6em' }}></i>
      </button>

      {open && (
        <div className="file-menu-dropdown" role="menu">
          {items.map((item, idx) => (
            <React.Fragment key={item.label}>
              {idx === 2 && <div className="file-menu-separator" />}
              <button className="file-menu-item" role="menuitem" onClick={() => run(item.action)}>
                <i className={`bi ${item.icon}`}></i>
                <span className="file-menu-item-label">{item.label}</span>
                <span className="file-menu-item-shortcut">{item.shortcut}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileMenu;
