import React, { useState, useEffect } from 'react';

interface LicenseActivationProps {
  onActivated: () => void;
}

const LicenseActivation: React.FC<LicenseActivationProps> = ({ onActivated }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [machineId, setMachineId] = useState('');

  useEffect(() => {
    // Load machine ID for support purposes
    window.licenseAPI.getMachineId().then((result) => {
      setMachineId(result.machineId);
    });
  }, []);

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();

    // Remove any non-alphanumeric characters except dashes
    value = value.replace(/[^A-Z0-9-]/g, '');

    // Remove existing dashes
    value = value.replace(/-/g, '');

    // Add dashes after every 4 characters
    if (value.length > 0) {
      const parts = [];
      for (let i = 0; i < value.length; i += 4) {
        parts.push(value.substring(i, i + 4));
      }
      value = parts.join('-');
    }

    // Limit to 19 characters (XXXX-XXXX-XXXX-XXXX)
    if (value.length <= 19) {
      setLicenseKey(value);
      setError('');
    }
  };

  const handleActivate = async () => {
    if (licenseKey.replace(/-/g, '').length !== 16) {
      setError('Please enter a complete license key');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const result = await window.licenseAPI.activate(licenseKey);

      if (result.success) {
        // Success! Call the onActivated callback
        onActivated();
      } else {
        setError(result.message || 'Invalid license key');
      }
    } catch (err) {
      setError('An error occurred while validating the license. Please try again.');
      console.error('[LICENSE] Activation error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating) {
      handleActivate();
    }
  };

  return (
    <div className="license-activation-overlay">
      <div className="license-activation-container">
        <div className="license-activation-header">
          <h1>NettUp</h1>
          <p className="subtitle">License Activation Required</p>
        </div>

        <div className="license-activation-content">
          <div className="icon-container">
            <i className="bi bi-shield-lock" style={{ fontSize: '64px', color: '#4a90e2' }}></i>
          </div>

          <p className="instruction">
            Please enter your license key to activate NettUp.
            <br />
            Your license key should be in the format: XXXX-XXXX-XXXX-XXXX
          </p>

          <div className="license-input-group">
            <input
              type="text"
              className="license-input"
              value={licenseKey}
              onChange={handleKeyChange}
              onKeyPress={handleKeyPress}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              disabled={isValidating}
              autoFocus
              maxLength={19}
            />

            {error && (
              <div className="license-error">
                <i className="bi bi-exclamation-circle"></i> {error}
              </div>
            )}
          </div>

          <button
            className="license-activate-btn"
            onClick={handleActivate}
            disabled={isValidating || licenseKey.replace(/-/g, '').length !== 16}
          >
            {isValidating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Validating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Activate License
              </>
            )}
          </button>

          <div className="license-info">
            <p className="support-text">
              Need help? Contact support with your Machine ID:
              <br />
              <code className="machine-id">{machineId || 'Loading...'}</code>
            </p>
          </div>
        </div>

        <div className="license-activation-footer">
          <p>&copy; 2024 NettUp. All rights reserved.</p>
        </div>
      </div>

      <style>{`
        .license-activation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .license-activation-container {
          background: #0f3460;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          padding: 48px;
          max-width: 600px;
          width: 90%;
          text-align: center;
          animation: slideIn 0.4s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .license-activation-header h1 {
          color: #ffffff;
          font-size: 36px;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .license-activation-header .subtitle {
          color: #a0a0a0;
          font-size: 18px;
          margin-bottom: 32px;
        }

        .license-activation-content {
          margin: 32px 0;
        }

        .icon-container {
          margin-bottom: 24px;
        }

        .instruction {
          color: #e1e1e1;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .license-input-group {
          margin-bottom: 24px;
        }

        .license-input {
          width: 100%;
          padding: 16px 20px;
          font-size: 20px;
          font-family: 'Consolas', 'Courier New', monospace;
          font-weight: 600;
          letter-spacing: 2px;
          text-align: center;
          background: #16213e;
          border: 2px solid #4a90e2;
          border-radius: 8px;
          color: #ffffff;
          outline: none;
          transition: all 0.3s ease;
        }

        .license-input:focus {
          border-color: #5eb3f6;
          box-shadow: 0 0 0 4px rgba(74, 144, 226, 0.2);
        }

        .license-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .license-input::placeholder {
          color: #666;
          font-size: 18px;
        }

        .license-error {
          margin-top: 12px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #ff6b6b;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .license-activate-btn {
          width: 100%;
          padding: 16px 32px;
          font-size: 18px;
          font-weight: 600;
          background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .license-activate-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #5eb3f6 0%, #4a90e2 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
        }

        .license-activate-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .license-activate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .license-info {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .support-text {
          color: #a0a0a0;
          font-size: 14px;
          line-height: 1.6;
        }

        .machine-id {
          display: inline-block;
          margin-top: 8px;
          padding: 8px 12px;
          background: #16213e;
          border: 1px solid #4a90e2;
          border-radius: 4px;
          color: #4a90e2;
          font-family: var(--font-family-modern);
          font-size: 12px;
          letter-spacing: 1px;
        }

        .license-activation-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: #666;
          font-size: 12px;
        }

        .spinner-border {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          vertical-align: text-bottom;
          border: 0.2em solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spinner-border 0.75s linear infinite;
        }

        @keyframes spinner-border {
          to {
            transform: rotate(360deg);
          }
        }

        .spinner-border-sm {
          width: 0.875rem;
          height: 0.875rem;
          border-width: 0.15em;
        }

        .me-2 {
          margin-right: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default LicenseActivation;
