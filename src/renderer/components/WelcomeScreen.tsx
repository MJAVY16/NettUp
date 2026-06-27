import React from 'react';

interface RecentProject {
  name: string;
  path: string;
  lastOpened: string;
}

interface WelcomeScreenProps {
  recentProjects: RecentProject[];
  onNewProject: () => void;
  onOpenProject: () => void;
  onOpenRecent: (path: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  recentProjects,
  onNewProject,
  onOpenProject,
  onOpenRecent
}) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '3rem',
            color: 'var(--primary-color)',
            fontFamily: 'var(--font-family-modern)',
            letterSpacing: '2px',
            textShadow: 'var(--glow-strong)'
          }}>
            <i className="bi bi-currency-dollar"></i> NettUp
          </h1>
          <div style={{
            marginTop: '0.5rem',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-family-modern)',
            letterSpacing: '3px'
          }}>
            FINANCE MANAGEMENT SYSTEM
          </div>
        </div>

        {/* Main Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {/* New Project Card */}
          <button
            onClick={onNewProject}
            style={{
              background: 'var(--surface-color)',
              color: 'var(--text-primary)',
              border: '2px solid var(--primary-color)',
              borderRadius: 'var(--radius)',
              padding: '3rem 2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              e.currentTarget.style.transform = 'translateY(-5px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, height: '3px',
              background: 'linear-gradient(90deg, transparent 0%, var(--primary-color) 50%, transparent 100%)'
            }} />
            <div style={{ fontSize: '4rem', color: 'var(--primary-color)', marginBottom: '1rem', textAlign: 'center' }}>
              <i className="bi bi-plus-circle"></i>
            </div>
            <h2 style={{
              margin: 0, marginBottom: '0.5rem', fontSize: '1.5rem', color: 'var(--primary-color)',
              fontFamily: 'var(--font-family-modern)', letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center'
            }}>
              NEW PROJECT
            </h2>
            <p style={{
              margin: 0, color: 'var(--text-secondary)', fontFamily: 'var(--font-family-modern)',
              fontSize: '11px', textAlign: 'center', letterSpacing: '1px'
            }}>
              START A NEW FINANCIAL PROFILE
            </p>
          </button>

          {/* Open Project Card */}
          <button
            onClick={onOpenProject}
            style={{
              background: 'var(--surface-color)',
              color: 'var(--text-primary)',
              border: '2px solid var(--secondary-color)',
              borderRadius: 'var(--radius)',
              padding: '3rem 2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              e.currentTarget.style.transform = 'translateY(-5px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, height: '3px',
              background: 'linear-gradient(90deg, transparent 0%, var(--secondary-color) 50%, transparent 100%)'
            }} />
            <div style={{ fontSize: '4rem', color: 'var(--secondary-color)', marginBottom: '1rem', textAlign: 'center' }}>
              <i className="bi bi-folder2-open"></i>
            </div>
            <h2 style={{
              margin: 0, marginBottom: '0.5rem', fontSize: '1.5rem', color: 'var(--secondary-color)',
              fontFamily: 'var(--font-family-modern)', letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center'
            }}>
              OPEN PROJECT
            </h2>
            <p style={{
              margin: 0, color: 'var(--text-secondary)', fontFamily: 'var(--font-family-modern)',
              fontSize: '11px', textAlign: 'center', letterSpacing: '1px'
            }}>
              LOAD AN EXISTING PROJECT FILE
            </p>
          </button>

        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div style={{
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            padding: '2rem'
          }}>
            <h3 style={{
              margin: 0, marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--info-color)',
              fontFamily: 'var(--font-family-modern)', letterSpacing: '2px', textTransform: 'uppercase'
            }}>
              <i className="bi bi-clock-history"></i> RECENT PROJECTS
            </h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {recentProjects.map((project, idx) => (
                <button
                  key={idx}
                  onClick={() => onOpenRecent(project.path)}
                  style={{
                    background: 'var(--surface-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem 1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--info-color)';
                    e.currentTarget.style.background = 'color-mix(in srgb, var(--info-color) 8%, transparent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'var(--surface-elevated)';
                  }}
                >
                  <div>
                    <div style={{
                      color: 'var(--text-primary)', fontFamily: 'var(--font-family-modern)',
                      fontSize: '13px', marginBottom: '0.25rem', letterSpacing: '1px'
                    }}>
                      <i className="bi bi-file-earmark-text"></i> {project.name}
                    </div>
                    <div style={{
                      color: 'var(--text-dim)', fontFamily: 'var(--font-family-modern)',
                      fontSize: '12px', letterSpacing: '0.5px'
                    }}>
                      {project.path}
                    </div>
                  </div>
                  <div style={{
                    color: 'var(--text-secondary)', fontFamily: 'var(--font-family-modern)',
                    fontSize: '10px', letterSpacing: '1px'
                  }}>
                    {project.lastOpened}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Branding */}
        <div style={{
          marginTop: '3rem',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-family-modern)',
          fontSize: '10px',
          letterSpacing: '2px'
        }}>
          POWERED BY LOGIKORE
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
