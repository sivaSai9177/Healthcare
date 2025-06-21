import crypto from 'crypto';
import { z } from 'zod';

// Encryption configuration
const ENCRYPTION_CONFIG = {
  ALGORITHM: 'aes-256-gcm' as const,
  KEY_LENGTH: 32, // 256 bits
  IV_LENGTH: 16, // 128 bits
  TAG_LENGTH: 16, // 128 bits
  KEY_DERIVATION_ITERATIONS: 100000,
  SALT_LENGTH: 32,
};

// Environment configuration
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || crypto.randomBytes(32);
const KEY_ROTATION_INTERVAL_DAYS = parseInt(process.env.KEY_ROTATION_INTERVAL_DAYS || '90');

// Validation schemas
export const encryptedDataSchema = z.object({
  data: z.string(), // Base64 encoded encrypted data
  iv: z.string(), // Base64 encoded initialization vector
  tag: z.string(), // Base64 encoded authentication tag
  keyId: z.string(), // Key identifier for rotation
  algorithm: z.string().default(ENCRYPTION_CONFIG.ALGORITHM),
  timestamp: z.number().default(() => Date.now()),
});

export const keyMetadataSchema = z.object({
  id: z.string(),
  algorithm: z.string(),
  createdAt: z.date(),
  rotatedAt: z.date().optional(),
  isActive: z.boolean().default(true),
  purpose: z.enum(['data', 'session', 'backup', 'archive']),
});

export type EncryptedData = z.infer<typeof encryptedDataSchema>;
export type KeyMetadata = z.infer<typeof keyMetadataSchema>;

// Field-level encryption configuration
interface FieldEncryptionConfig {
  enabled: boolean;
  sensitiveFields: string[];
  algorithm: string;
  keyRotationDays: number;
}

const FIELD_ENCRYPTION_CONFIG: Record<string, FieldEncryptionConfig> = {
  user: {
    enabled: true,
    sensitiveFields: ['email', 'phoneNumber', 'emergencyContact'],
    algorithm: ENCRYPTION_CONFIG.ALGORITHM,
    keyRotationDays: KEY_ROTATION_INTERVAL_DAYS,
  },
  organization: {
    enabled: true,
    sensitiveFields: ['taxId', 'bankAccount', 'contactInfo'],
    algorithm: ENCRYPTION_CONFIG.ALGORITHM,
    keyRotationDays: KEY_ROTATION_INTERVAL_DAYS,
  },
  session: {
    enabled: true,
    sensitiveFields: ['token', 'refreshToken'],
    algorithm: ENCRYPTION_CONFIG.ALGORITHM,
    keyRotationDays: 30, // More frequent rotation for session data
  },
  auditLog: {
    enabled: true,
    sensitiveFields: ['metadata', 'beforeState', 'afterState'],
    algorithm: ENCRYPTION_CONFIG.ALGORITHM,
    keyRotationDays: KEY_ROTATION_INTERVAL_DAYS,
  },
};

export class EncryptionService {
  private static instance: EncryptionService;
  private keyCache: Map<string, Buffer> = new Map();
  private currentKeyId: string;

  private constructor() {
    this.currentKeyId = this.generateKeyId();
    this.initializeKeys();
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Encrypt sensitive data with AES-256-GCM
   */
  async encrypt(
    plaintext: string, 
    purpose: 'data' | 'session' | 'backup' | 'archive' = 'data',
    keyId?: string
  ): Promise<EncryptedData> {
    try {
      if (!plaintext) {
        throw new Error('Plaintext cannot be empty');
      }

      const effectiveKeyId = keyId || this.currentKeyId;
      const encryptionKey = await this.getEncryptionKey(effectiveKeyId);
      
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(ENCRYPTION_CONFIG.IV_LENGTH);
      
      // Create cipher with IV
      const cipher = crypto.createCipheriv(ENCRYPTION_CONFIG.ALGORITHM, encryptionKey, iv) as crypto.CipherGCM;
      cipher.setAAD(Buffer.from(effectiveKeyId)); // Additional authenticated data
      
      // Encrypt the data
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      return {
        data: encrypted,
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        keyId: effectiveKeyId,
        algorithm: ENCRYPTION_CONFIG.ALGORITHM,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[ENCRYPTION] Encryption failed:', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using stored metadata
   */
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    try {
      // Validate input
      const validated = encryptedDataSchema.parse(encryptedData);
      
      const encryptionKey = await this.getEncryptionKey(validated.keyId);
      
      // Create decipher with IV
      const iv = Buffer.from(validated.iv, 'base64');
      const decipher = crypto.createDecipheriv(validated.algorithm, encryptionKey, iv) as crypto.DecipherGCM;
      decipher.setAAD(Buffer.from(validated.keyId));
      decipher.setAuthTag(Buffer.from(validated.tag, 'base64'));
      
      // Decrypt the data
      let decrypted = decipher.update(validated.data, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('[ENCRYPTION] Decryption failed:', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt object fields based on configuration
   */
  async encryptFields(
    obj: Record<string, any>, 
    entityType: keyof typeof FIELD_ENCRYPTION_CONFIG
  ): Promise<Record<string, any>> {
    const config = FIELD_ENCRYPTION_CONFIG[entityType];
    if (!config?.enabled) {
      return obj;
    }

    const result = { ...obj };
    
    for (const field of config.sensitiveFields) {
      if (obj[field] !== undefined && obj[field] !== null) {
        try {
          const encrypted = await this.encrypt(
            typeof obj[field] === 'string' ? obj[field] : JSON.stringify(obj[field]),
            'data'
          );
          result[`${field}_encrypted`] = JSON.stringify(encrypted);
          result[field] = '[ENCRYPTED]'; // Replace with placeholder
        } catch (error) {
          console.error(`[ENCRYPTION] Failed to encrypt field ${field}:`, error);
          // Continue with unencrypted data rather than failing
        }
      }
    }

    return result;
  }

  /**
   * Decrypt object fields based on configuration
   */
  async decryptFields(
    obj: Record<string, any>, 
    entityType: keyof typeof FIELD_ENCRYPTION_CONFIG
  ): Promise<Record<string, any>> {
    const config = FIELD_ENCRYPTION_CONFIG[entityType];
    if (!config?.enabled) {
      return obj;
    }

    const result = { ...obj };
    
    for (const field of config.sensitiveFields) {
      const encryptedFieldName = `${field}_encrypted`;
      if (obj[encryptedFieldName]) {
        try {
          const encryptedData = JSON.parse(obj[encryptedFieldName]);
          const decrypted = await this.decrypt(encryptedData);
          
          // Try to parse as JSON, fallback to string
          try {
            result[field] = JSON.parse(decrypted);
          } catch {
            result[field] = decrypted;
          }
          
          // Remove encrypted field from result
          delete result[encryptedFieldName];
        } catch (error) {
          console.error(`[ENCRYPTION] Failed to decrypt field ${field}:`, error);
          // Keep the encrypted field and set original to null
          result[field] = null;
        }
      }
    }

    return result;
  }

  /**
   * Generate hash for data integrity verification
   */
  generateHash(data: string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Generate secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
    let password = '';
    
    // Ensure at least one character from each required category
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '@$!%*?&';
    
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += special[crypto.randomInt(special.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[crypto.randomInt(charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
  }

  /**
   * Key derivation for password-based encryption
   */
  deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      ENCRYPTION_CONFIG.KEY_DERIVATION_ITERATIONS,
      ENCRYPTION_CONFIG.KEY_LENGTH,
      'sha512'
    );
  }

  /**
   * Encrypt data with password (for backup/export)
   */
  async encryptWithPassword(plaintext: string, password: string): Promise<{
    data: string;
    salt: string;
    iv: string;
    tag: string;
  }> {
    const salt = crypto.randomBytes(ENCRYPTION_CONFIG.SALT_LENGTH);
    const key = this.deriveKey(password, salt);
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ENCRYPTION_CONFIG.ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const tag = cipher.getAuthTag();
    
    return {
      data: encrypted,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    };
  }

  /**
   * Decrypt data with password
   */
  async decryptWithPassword(
    encryptedData: { data: string; salt: string; iv: string; tag: string },
    password: string
  ): Promise<string> {
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const key = this.deriveKey(password, salt);
    
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const decipher = crypto.createDecipheriv(ENCRYPTION_CONFIG.ALGORITHM, key, iv);
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));
    
    let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(): Promise<string> {
    const newKeyId = this.generateKeyId();
    
    // Generate new key
    const newKey = crypto.randomBytes(ENCRYPTION_CONFIG.KEY_LENGTH);
    this.keyCache.set(newKeyId, newKey);
    
    // Update current key ID
    this.currentKeyId = newKeyId;
    
    // In production, save key metadata to secure storage
// TODO: Replace with structured logging - /* console.log(`[ENCRYPTION] Key rotated to ${newKeyId}`) */;
    
    return newKeyId;
  }

  /**
   * Get list of supported encryption algorithms
   */
  getSupportedAlgorithms(): string[] {
    return crypto.getCiphers().filter(cipher => 
      cipher.includes('gcm') || cipher.includes('aes')
    );
  }

  /**
   * Check if field should be encrypted
   */
  shouldEncryptField(entityType: string, fieldName: string): boolean {
    const config = FIELD_ENCRYPTION_CONFIG[entityType as keyof typeof FIELD_ENCRYPTION_CONFIG];
    return config?.enabled && config.sensitiveFields.includes(fieldName);
  }

  /**
   * Get encryption status for entity
   */
  getEncryptionStatus(entityType: string): FieldEncryptionConfig | null {
    return FIELD_ENCRYPTION_CONFIG[entityType as keyof typeof FIELD_ENCRYPTION_CONFIG] || null;
  }

  /**
   * Private helper methods
   */
  private generateKeyId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `key_${timestamp}_${random}`;
  }

  private async getEncryptionKey(keyId: string): Promise<Buffer> {
    if (!this.keyCache.has(keyId)) {
      // In production, retrieve key from secure key management system
      // For now, derive from master key and keyId
      const derivedKey = crypto.createHmac('sha256', MASTER_KEY)
        .update(keyId)
        .digest();
      
      this.keyCache.set(keyId, derivedKey);
    }
    
    return this.keyCache.get(keyId)!;
  }

  private initializeKeys(): void {
    // Initialize with current key
    this.getEncryptionKey(this.currentKeyId);
    
    // Set up key rotation schedule
    setInterval(() => {
      this.rotateKeys().catch(error => {
        console.error('[ENCRYPTION] Key rotation failed:', error);
      });
    }, KEY_ROTATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
  }

  public destroy(): void {
    this.keyCache.clear();
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();

// Utility functions for common encryption tasks
export const encryptionUtils = {
  /**
   * Encrypt sensitive user data
   */
  async encryptUserData(userData: Record<string, any>): Promise<Record<string, any>> {
    return encryptionService.encryptFields(userData, 'user');
  },

  /**
   * Decrypt sensitive user data
   */
  async decryptUserData(userData: Record<string, any>): Promise<Record<string, any>> {
    return encryptionService.decryptFields(userData, 'user');
  },

  /**
   * Encrypt session data
   */
  async encryptSessionData(sessionData: Record<string, any>): Promise<Record<string, any>> {
    return encryptionService.encryptFields(sessionData, 'session');
  },

  /**
   * Decrypt session data
   */
  async decryptSessionData(sessionData: Record<string, any>): Promise<Record<string, any>> {
    return encryptionService.decryptFields(sessionData, 'session');
  },

  /**
   * Encrypt audit log data
   */
  async encryptAuditData(auditData: Record<string, any>): Promise<Record<string, any>> {
    return encryptionService.encryptFields(auditData, 'auditLog');
  },

  /**
   * Hash password securely
   */
  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  },

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 64, 'sha512');
    return hash === verifyHash.toString('hex');
  },

  /**
   * Generate secure API key
   */
  generateApiKey(): { key: string; hash: string } {
    const key = encryptionService.generateSecureToken(32);
    const hash = encryptionService.generateHash(key);
    return { key, hash };
  },
};

export default encryptionService;