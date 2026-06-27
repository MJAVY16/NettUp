import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      fontSize: '12px',
      color: 'var(--text-dim)',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-family)'
    }}>
      {currentTime.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      })} • {currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })}
    </div>
  );
};

export default Clock;
