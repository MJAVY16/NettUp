import Store from 'electron-store';
import * as crypto from 'crypto';
import * as os from 'os';
import { validateLicenseKey } from './licenseGenerator';

interface LicenseData {
  key: string;
  activatedAt: string;
  machineId?: string;
  isValid: boolean;
}

interface StoreType {
  license?: LicenseData;
}

const store = new Store<StoreType>({
  name: 'license',
  encryptionKey: process.env.LICENSE_ENC_KEY || 'a711144014139cd9a4e7a684b2fe86d328dcbe4bf49c8c1c'
}) as Store<StoreType> & {
  get(key: 'license'): LicenseData | undefined;
  set(key: 'license', value: LicenseData): void;
  delete(key: 'license'): void;
};

/**
 * License Manager
 * Handles license validation, storage, and verification
 */
export class LicenseManager {
  /**
   * Activates a license key
   * @param key The license key to activate
   * @param requireMachineBinding If true, binds the license to this machine
   * @returns Object with success status and message
   */
  static async activateLicense(key: string, requireMachineBinding = false): Promise<{
    success: boolean;
    message: string;
  }> {
    // Validate the key format and checksum
    if (!validateLicenseKey(key)) {
      return {
        success: false,
        message: 'Invalid license key format. Please check your key and try again.'
      };
    }

    // Optional: Check if key is already used on a different machine
    const existingLicense = store.get('license');
    if (existingLicense && requireMachineBinding) {
      const currentMachineId = this.getMachineId();
      if (existingLicense.machineId && existingLicense.machineId !== currentMachineId) {
        return {
          success: false,
          message: 'This license key is already activated on another machine.'
        };
      }
    }

    // Store the license
    const licenseData: LicenseData = {
      key: key.toUpperCase().replace(/-/g, ''),
      activatedAt: new Date().toISOString(),
      machineId: requireMachineBinding ? this.getMachineId() : undefined,
      isValid: true
    };

    store.set('license', licenseData);

    console.log('[LICENSE] License activated successfully');
    return {
      success: true,
      message: 'License activated successfully!'
    };
  }

  /**
   * Checks if the application has a valid license
   * @returns true if licensed, false otherwise
   */
  static isLicensed(): boolean {
    const license = store.get('license');

    if (!license) {
      console.log('[LICENSE] No license found');
      return false;
    }

    // Validate the stored key
    const formattedKey = this.formatStoredKey(license.key);
    if (!validateLicenseKey(formattedKey)) {
      console.log('[LICENSE] Stored license key is invalid');
      return false;
    }

    // Optional: Check machine binding
    if (license.machineId) {
      const currentMachineId = this.getMachineId();
      if (license.machineId !== currentMachineId) {
        console.log('[LICENSE] License is bound to a different machine');
        return false;
      }
    }

    console.log('[LICENSE] Valid license found');
    return true;
  }

  /**
   * Gets the current license information
   * @returns License data or null if not licensed
   */
  static getLicenseInfo(): LicenseData | null {
    return store.get('license') || null;
  }

  /**
   * Deactivates the current license (removes from storage)
   */
  static deactivateLicense(): void {
    store.delete('license');
    console.log('[LICENSE] License deactivated');
  }

  /**
   * Gets a unique machine identifier
   * @returns A unique machine ID
   */
  static getMachineId(): string {
    const platform = os.platform();
    const hostname = os.hostname();
    const cpus = os.cpus().map(cpu => cpu.model).join('');

    const machineString = `${platform}-${hostname}-${cpus}`;

    return crypto
      .createHash('sha256')
      .update(machineString)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Formats a stored key (without dashes) to include dashes
   * @param key The key without dashes
   * @returns Formatted key with dashes
   */
  private static formatStoredKey(key: string): string {
    if (key.length !== 16) return key;
    return `${key.substring(0, 4)}-${key.substring(4, 8)}-${key.substring(8, 12)}-${key.substring(12, 16)}`;
  }

  /**
   * Validates a license key format without storing it
   * @param key The key to validate
   * @returns true if valid format, false otherwise
   */
  static validateKeyFormat(key: string): boolean {
    return validateLicenseKey(key);
  }

  /**
   * Gets license statistics (for debugging)
   * @returns License statistics
   */
  static getLicenseStats(): {
    isLicensed: boolean;
    activatedAt?: string;
    machineId?: string;
    machineIdMatch?: boolean;
  } {
    const license = store.get('license');
    const currentMachineId = this.getMachineId();

    return {
      isLicensed: this.isLicensed(),
      activatedAt: license?.activatedAt,
      machineId: license?.machineId,
      machineIdMatch: license?.machineId ? license.machineId === currentMachineId : undefined
    };
  }
}

// Optional: Online validation (commented out for now)
/*
export async function validateOnline(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://your-server.com/api/validate-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        machineId: LicenseManager.getMachineId()
      })
    });

    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error('[LICENSE] Online validation failed:', error);
    return false; // Fallback to offline validation
  }
}
*/
