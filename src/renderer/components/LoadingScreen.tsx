import React, { useState, useEffect } from 'react';
import appIcon from '../../../assets/icons/png/64x64.png';

const LoadingScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  // The active theme is applied to <html> at startup (from localStorage), so we
  // can read it here to decide which loading experience to show.
  const [isSpy] = useState(
    () => (document.documentElement.getAttribute('data-theme') || 'light') === 'spy'
  );
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageHistory, setMessageHistory] = useState<string[]>([]);

  const loadingMessages = [
    '> INITIALIZING SYSTEM...',
    '> LOADING FINANCIAL MODULES...',
    '> ESTABLISHING SECURE CONNECTION...',
    '> VERIFYING DATA INTEGRITY...',
    '> CALIBRATING ANALYTICS ENGINE...',
    '> PREPARING USER INTERFACE...',
    '> LOADING CHART LIBRARIES...',
    '> SYNCING CALCULATION PROTOCOLS...',
    '> ACTIVATING SECURITY MEASURES...',
    '> OPTIMIZING PERFORMANCE...',
    '> FINALIZING INITIALIZATION...',
    '> SYSTEM READY'
  ];

  useEffect(() => {
    // Light/Dark themes get a quick, simple splash with no progress animation.
    if (!isSpy) {
      const timer = setTimeout(onComplete, 1300);
      return () => clearTimeout(timer);
    }

    const totalDuration = 3000; // 3 seconds
    const progressInterval = 50;
    const steps = totalDuration / progressInterval;
    const progressIncrement = 100 / steps;

    const messageInterval = totalDuration / loadingMessages.length;
    let messageIndex = 0;

    // Progress bar animation
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const next = prev + progressIncrement;
        if (next >= 100) {
          clearInterval(progressTimer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return next;
      });
    }, progressInterval);

    // Message animation
    const messageTimer = setInterval(() => {
      if (messageIndex < loadingMessages.length) {
        const msg = loadingMessages[messageIndex];
        setCurrentMessage(msg);
        setMessageHistory(prev => [...prev, msg].slice(-5)); // Keep last 5 messages
        messageIndex++;
      } else {
        clearInterval(messageTimer);
      }
    }, messageInterval);

    return () => {
      clearInterval(progressTimer);
      clearInterval(messageTimer);
    };
  }, [onComplete, isSpy]);

  const squares = 20;
  const filledSquares = Math.floor((progress / 100) * squares);

  // Simple themed splash for Light/Dark themes.
  if (!isSpy) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--background-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.75rem',
        zIndex: 10000
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: 0,
            fontSize: '2.5rem',
            fontWeight: 700,
            letterSpacing: '1px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-family-modern)'
          }}>
            <img src={appIcon} alt="" style={{ height: '1.2em', width: 'auto', verticalAlign: '-0.2em', marginRight: '0.4rem', borderRadius: '6px' }} /> NettUp
          </h1>
          <div style={{
            marginTop: '0.4rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            letterSpacing: '0.5px',
            fontFamily: 'var(--font-family-modern)'
          }}>
            Finance Management System
          </div>
        </div>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#0a0e14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        width: '600px',
        padding: '3rem',
        background: '#0d1117',
        border: '2px solid var(--primary-color)',
        boxShadow: '0 0 30px rgba(0, 255, 159, 0.5), inset 0 0 20px rgba(0, 255, 159, 0.1)',
        position: 'relative'
      }}>
        {/* LogiKore Branding */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          fontSize: '12px',
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-family-modern)',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          LogiKore
        </div>

        {/* Main Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '2.5rem',
            color: 'var(--primary-color)',
            fontFamily: 'var(--font-family-modern)',
            letterSpacing: '2px',
            textShadow: '0 0 20px rgba(0, 255, 159, 0.8)'
          }}>
            NettUp
          </h1>
          <div style={{
            marginTop: '0.5rem',
            fontSize: '12px',
            color: 'var(--secondary-color)',
            fontFamily: 'var(--font-family-modern)',
            letterSpacing: '3px'
          }}>
            FINANCE MANAGEMENT SYSTEM
          </div>
        </div>

        {/* CLI Output */}
        <div style={{
          background: '#000',
          border: '1px solid var(--primary-color)',
          padding: '1rem',
          minHeight: '120px',
          marginBottom: '1.5rem',
          fontFamily: 'var(--font-family-modern)',
          fontSize: '11px',
          color: 'var(--primary-color)'
        }}>
          {messageHistory.map((msg, idx) => (
            <div key={idx} style={{
              marginBottom: '0.25rem',
              opacity: 0.5 + (idx / messageHistory.length) * 0.5
            }}>
              {msg}
            </div>
          ))}
          <div style={{
            color: 'var(--primary-color)',
            textShadow: '0 0 5px rgba(0, 255, 159, 0.8)'
          }}>
            {currentMessage}
            <span style={{ animation: 'blink 1s infinite' }}>_</span>
          </div>
        </div>

        {/* Loading Bar with Squares */}
        <div>
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '0.5rem'
          }}>
            {Array.from({ length: squares }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: '20px',
                  border: '1px solid var(--primary-color)',
                  background: idx < filledSquares
                    ? 'var(--primary-color)'
                    : 'transparent',
                  boxShadow: idx < filledSquares
                    ? '0 0 10px rgba(0, 255, 159, 0.8)'
                    : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
          <div style={{
            textAlign: 'center',
            fontFamily: 'var(--font-family-modern)',
            fontSize: '14px',
            color: 'var(--primary-color)',
            letterSpacing: '2px'
          }}>
            {Math.floor(progress)}% COMPLETE
          </div>
        </div>

        {/* Decorative corner elements */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '20px',
          height: '20px',
          borderTop: '2px solid var(--secondary-color)',
          borderLeft: '2px solid var(--secondary-color)'
        }} />
        <div style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: '20px',
          height: '20px',
          borderTop: '2px solid var(--secondary-color)',
          borderRight: '2px solid var(--secondary-color)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '20px',
          height: '20px',
          borderBottom: '2px solid var(--secondary-color)',
          borderLeft: '2px solid var(--secondary-color)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '0',
          right: '0',
          width: '20px',
          height: '20px',
          borderBottom: '2px solid var(--secondary-color)',
          borderRight: '2px solid var(--secondary-color)'
        }} />
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
