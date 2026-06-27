import React, { useState } from 'react';
import { LogEntry } from '../types';
import { formatCurrencyWithSymbol } from '../utils/formatters';

interface LogsManagerProps {
  logs: LogEntry[];
}

const LogsManager: React.FC<LogsManagerProps> = ({ logs }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');

  // Safety check: ensure logs is an array (for backward compatibility)
  const safeLogs = logs || [];

  // Filter logs
  const filteredLogs = safeLogs.filter(log => {
    if (filterType !== 'all' && log.type !== filterType) return false;
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    return true;
  });

  // Sort logs by timestamp (most recent first)
  const sortedLogs = [...filteredLogs].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'debt': return 'bi-dash-circle';
      case 'expense': return 'bi-arrow-down-circle';
      case 'income': return 'bi-plus-circle';
      case 'budget': return 'bi-list-check';
      case 'milestone': return 'bi-trophy';
      case 'note': return 'bi-journal-text';
      default: return 'bi-circle';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'debt': return 'var(--danger-color)';
      case 'expense': return 'var(--warning-color)';
      case 'income': return 'var(--success-color)';
      case 'budget': return 'var(--primary-color)';
      case 'milestone': return 'var(--info-color)';
      case 'note': return 'var(--text-secondary)';
      default: return 'var(--text-primary)';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'added': return 'ADDED';
      case 'updated': return 'UPDATED';
      case 'deleted': return 'DELETED';
      case 'paid-off': return 'PAID OFF';
      case 'completed': return 'COMPLETED';
      default: return action.toUpperCase();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="logs-manager">
      <div className="section">
        <h2 className="section-title">
          <i className="bi bi-clock-history"></i> Transaction Logs
        </h2>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontFamily: 'var(--font-family)',
              fontSize: '11px',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              letterSpacing: '1px'
            }}>
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#000',
                border: '1px solid var(--primary-color)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family)',
                fontSize: '11px'
              }}
            >
              <option value="all">ALL TYPES</option>
              <option value="debt">DEBT</option>
              <option value="expense">EXPENSE</option>
              <option value="income">INCOME</option>
              <option value="budget">BUDGET</option>
              <option value="milestone">MILESTONE</option>
              <option value="note">NOTE</option>
            </select>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontFamily: 'var(--font-family)',
              fontSize: '11px',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              letterSpacing: '1px'
            }}>
              Filter by Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#000',
                border: '1px solid var(--primary-color)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family)',
                fontSize: '11px'
              }}
            >
              <option value="all">ALL ACTIONS</option>
              <option value="added">ADDED</option>
              <option value="updated">UPDATED</option>
              <option value="deleted">DELETED</option>
              <option value="paid-off">PAID OFF</option>
              <option value="completed">COMPLETED</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'rgba(0, 212, 255, 0.05)',
          border: '1px solid var(--info-color)',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-family)',
          fontSize: '11px'
        }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>TOTAL LOGS: </span>
            <span style={{ color: 'var(--info-color)', fontWeight: 600 }}>{safeLogs.length}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>FILTERED: </span>
            <span style={{ color: 'var(--info-color)', fontWeight: 600 }}>{sortedLogs.length}</span>
          </div>
        </div>

        {/* Logs Table */}
        {sortedLogs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>Timestamp</th>
                  <th style={{ width: '100px' }}>Type</th>
                  <th style={{ width: '100px' }}>Action</th>
                  <th style={{ width: '200px' }}>Entity</th>
                  <th>Description</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {sortedLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{
                      fontFamily: 'var(--font-family)',
                      fontSize: '12px',
                      color: 'var(--text-dim)'
                    }}>
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: getTypeColor(log.type)
                      }}>
                        <i className={`bi ${getTypeIcon(log.type)}`}></i>
                        <span style={{
                          fontFamily: 'var(--font-family)',
                          fontSize: '12px',
                          textTransform: 'uppercase'
                        }}>
                          {log.type}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-family)',
                        fontSize: '12px',
                        padding: '2px 6px',
                        background: 'rgba(0, 212, 255, 0.1)',
                        border: '1px solid var(--primary-color)',
                        color: 'var(--primary-color)',
                        fontWeight: 600
                      }}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td style={{
                      fontWeight: 500,
                      color: 'var(--text-primary)'
                    }}>
                      {log.entityName || '-'}
                    </td>
                    <td style={{
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-family)',
                      fontSize: '11px'
                    }}>
                      {log.description}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontFamily: 'var(--font-family)',
                      fontWeight: 600,
                      color: log.amount ? 'var(--text-primary)' : 'var(--text-dim)'
                    }}>
                      {log.amount ? formatCurrencyWithSymbol(log.amount) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <i className="bi bi-inbox" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
            <div className="empty-state-text">
              {safeLogs.length === 0 ? 'No logs yet' : 'No logs match the current filters'}
            </div>
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-family)'
            }}>
              {safeLogs.length === 0
                ? 'Activity will be logged automatically as you work'
                : 'Try adjusting your filters'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsManager;
