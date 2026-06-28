import React from 'react';
import { FinancialProject } from '../types';
import { SUPPORTED_CURRENCIES, setCurrencyConfig } from '../utils/formatters';

interface SettingsProps {
  project: FinancialProject;
  onUpdateSettings: (settings: Partial<FinancialProject['settings']>) => void;
}

const Settings: React.FC<SettingsProps> = ({ project, onUpdateSettings }) => {
  const themes: Array<{ key: FinancialProject['settings']['theme']; label: string; desc: string; icon: string; sharp: boolean; colors: { bg: string; surface: string; text: string; accent: string } }> = [
    {
      key: 'spy',
      label: 'Spy',
      desc: 'Terminal · Monospace',
      icon: 'bi-terminal',
      sharp: true,
      colors: { bg: '#0a0e14', surface: '#0d1117', text: '#00ff9f', accent: '#00ff9f' }
    },
    {
      key: 'dark',
      label: 'Dark',
      desc: 'Modern · Inter',
      icon: 'bi-moon-stars',
      sharp: false,
      colors: { bg: '#1a1a2e', surface: '#16213e', text: '#ffffff', accent: '#3498db' }
    },
    {
      key: 'light',
      label: 'Light',
      desc: 'Bright · Inter',
      icon: 'bi-sun',
      sharp: false,
      colors: { bg: '#f5f6fa', surface: '#ffffff', text: '#2d3436', accent: '#3498db' }
    }
  ];

  const handleThemeChange = (theme: FinancialProject['settings']['theme']) => {
    onUpdateSettings({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleCurrencyChange = (code: string) => {
    onUpdateSettings({ currency: code });
    setCurrencyConfig(code);
  };

  return (
    <div className="settings">
      <div className="section">
        <h2 className="section-title">Settings</h2>

        {/* Theme Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>
            <i className="bi bi-palette"></i> Theme
          </h3>
          <div className="theme-grid">
            {themes.map(theme => {
              const selected = project.settings.theme === theme.key;
              const cardRadius = theme.sharp ? '2px' : '5px';
              return (
                <button
                  key={theme.key}
                  className={`theme-card ${selected ? 'selected' : ''}`}
                  onClick={() => handleThemeChange(theme.key)}
                  aria-pressed={selected}
                >
                  {selected && (
                    <span className="theme-card-check" style={{ background: theme.colors.accent }}>
                      <i className="bi bi-check-lg"></i>
                    </span>
                  )}

                  {/* Mini app-window preview reflecting the theme's colors & shape */}
                  <div
                    className="theme-preview"
                    style={{
                      background: theme.colors.bg,
                      borderRadius: theme.sharp ? '4px' : '8px',
                      border: `1px solid ${theme.colors.surface}`
                    }}
                  >
                    {/* title bar */}
                    <div style={{
                      height: '13px', display: 'flex', alignItems: 'center', gap: '3px', padding: '0 5px',
                      background: theme.colors.surface, borderBottom: `1px solid ${theme.colors.accent}`
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: theme.colors.accent }} />
                      <span style={{ width: '22px', height: '3px', borderRadius: '2px', background: theme.colors.text, opacity: 0.5 }} />
                    </div>
                    {/* body: sidebar + cards */}
                    <div style={{ flex: 1, display: 'flex', gap: '5px', padding: '5px' }}>
                      <div style={{
                        width: '15px', display: 'flex', flexDirection: 'column', gap: '3px', padding: '3px',
                        background: theme.colors.surface, borderRadius: cardRadius
                      }}>
                        <span style={{ height: '3px', borderRadius: '2px', background: theme.colors.accent }} />
                        <span style={{ height: '3px', borderRadius: '2px', background: theme.colors.text, opacity: 0.3 }} />
                        <span style={{ height: '3px', borderRadius: '2px', background: theme.colors.text, opacity: 0.3 }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ flex: 1, background: theme.colors.surface, borderRadius: cardRadius, border: `1px solid ${theme.colors.accent}` }} />
                        <div style={{ flex: 1, background: theme.colors.surface, borderRadius: cardRadius, border: `1px solid ${theme.colors.text}33` }} />
                      </div>
                    </div>
                  </div>

                  <div className="theme-card-name">
                    <i className={`bi ${theme.icon}`} style={{ color: theme.colors.accent }}></i>
                    {theme.label}
                  </div>
                  <div className="theme-card-desc">{theme.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Currency Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>
            <i className="bi bi-currency-exchange"></i> Currency
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
            {SUPPORTED_CURRENCIES.map(currency => (
              <button
                key={currency.code}
                onClick={() => handleCurrencyChange(currency.code)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: project.settings.currency === currency.code
                    ? '2px solid var(--primary-color)'
                    : '1px solid var(--border-color)',
                  background: project.settings.currency === currency.code
                    ? 'color-mix(in srgb, var(--info-color) 8%, transparent)'
                    : 'var(--surface-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{currency.flag}</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{currency.code}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{currency.symbol}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>
            <i className="bi bi-translate"></i> Language
          </h3>
          <div style={{
            padding: '1rem', background: 'var(--surface-elevated-color, var(--surface-color))',
            borderRadius: '6px', border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)', fontSize: '0.9rem'
          }}>
            <i className="bi bi-clock-history"></i> Multi-language support coming soon. Currently English only.
          </div>
        </div>

        {/* Payments */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>
            <i className="bi bi-calendar-check"></i> Payments
          </h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={!!project.settings.autoApplyPayments}
              onChange={(e) => onUpdateSettings({ autoApplyPayments: e.target.checked })}
            />
            <span>
              Automatically apply payments when due
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                When off, NettUp asks you to confirm due payments on open.
              </span>
            </span>
          </label>
        </div>

        {/* About */}
        <div>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>
            <i className="bi bi-info-circle"></i> About
          </h3>
          <div style={{
            padding: '1rem', background: 'var(--surface-elevated-color, var(--surface-color))',
            borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>NettUp</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Personal finance management tool. Track income, debts, expenses, budgets, and savings goals.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
