import crypto from 'crypto';

export interface SecurityConfig {
  encryptionKey: string;
  hashAlgorithm: string;
  saltRounds: number;
  sessionTimeout: number; // in minutes
  maxFileSize: number; // in bytes
  allowedFileTypes: string[];
  auditLogging: boolean;
}

export class QuestionnaireSecurityService {
  private static readonly DEFAULT_CONFIG: SecurityConfig = {
    encryptionKey: process.env.QUESTIONNAIRE_ENCRYPTION_KEY || 'default-key-change-in-production',
    hashAlgorithm: 'sha256',
    saltRounds: 12,
    sessionTimeout: 30,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    auditLogging: true
  };

  /**
   * Encrypt sensitive data
   */
  static encryptData(data: string, key?: string): string {
    try {
      const encryptionKey = key || this.DEFAULT_CONFIG.encryptionKey;
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decryptData(encryptedData: string, key?: string): string {
    try {
      const encryptionKey = key || this.DEFAULT_CONFIG.encryptionKey;
      const parts = encryptedData.split(':');
      
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }
      
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Hash data for integrity verification
   */
  static hashData(data: string): string {
    return crypto
      .createHash(this.DEFAULT_CONFIG.hashAlgorithm)
      .update(data)
      .digest('hex');
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate file upload security
   */
  static validateFileUpload(file: File): {
    isValid: boolean;
    error?: string;
  } {
    // Check file size
    if (file.size > this.DEFAULT_CONFIG.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${this.DEFAULT_CONFIG.maxFileSize / (1024 * 1024)}MB`
      };
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.DEFAULT_CONFIG.allowedFileTypes.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File type ${fileExtension} is not allowed. Allowed types: ${this.DEFAULT_CONFIG.allowedFileTypes.join(', ')}`
      };
    }

    // Check for malicious file names
    if (this.containsMaliciousContent(file.name)) {
      return {
        isValid: false,
        error: 'File name contains potentially malicious content'
      };
    }

    return { isValid: true };
  }

  /**
   * Check for malicious content in file names
   */
  private static containsMaliciousContent(filename: string): boolean {
    const maliciousPatterns = [
      /\.\./, // Directory traversal
      /[<>:"|?*]/, // Invalid characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved names
      /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i // Executable extensions
    ];

    return maliciousPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate questionnaire data integrity
   */
  static validateQuestionnaireIntegrity(questionnaireData: {
    title?: string;
    questions?: unknown[];
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
  }): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!questionnaireData.title || questionnaireData.title.trim().length === 0) {
      errors.push('Questionnaire title is required');
    }

    if (!questionnaireData.questions || !Array.isArray(questionnaireData.questions)) {
      errors.push('Questions array is required');
    }

    // Validate questions
    if (questionnaireData.questions) {
      (questionnaireData.questions as unknown[]).forEach((question: unknown, index: number) => {
        const q = question as {
          questionText?: string;
          questionType?: string;
          options?: unknown[];
          [key: string]: unknown;
        };
        if (!q.questionText || q.questionText.trim().length === 0) {
          errors.push(`Question ${index + 1}: Question text is required`);
        }

        if (!q.questionType) {
          errors.push(`Question ${index + 1}: Question type is required`);
        }

        // Validate question type
        const validTypes = [
          'TEXT_INPUT', 'MULTIPLE_CHOICE', 'YES_NO', 'RATING_SCALE',
          'DATE_PICKER', 'FILE_UPLOAD', 'CHECKBOX_LIST', 'DROPDOWN'
        ];
        if (!validTypes.includes(q.questionType as string)) {
          errors.push(`Question ${index + 1}: Invalid question type`);
        }

        // Sanitize question text
        if (q.questionText) {
          q.questionText = this.sanitizeInput(q.questionText);
        }
      });
    }

    // Validate client name if provided
    if (questionnaireData.clientName) {
      questionnaireData.clientName = this.sanitizeInput(questionnaireData.clientName as string);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate audit log entry
   */
  static generateAuditLog(
    action: string,
    userId: string,
    questionnaireId?: string,
    metadata?: Record<string, unknown>
  ): {
    id: string;
    action: string;
    userId: string;
    questionnaireId?: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
    ipAddress?: string;
  } {
    return {
      id: this.generateSecureToken(16),
      action,
      userId,
      questionnaireId,
      timestamp: new Date(),
      ipAddress: '127.0.0.1', // This should be extracted from request
      metadata: metadata || {}
    };
  }

  /**
   * Verify data integrity using hash
   */
  static verifyDataIntegrity(data: string, expectedHash: string): boolean {
    const actualHash = this.hashData(data);
    return actualHash === expectedHash;
  }

  /**
   * Generate secure export token
   */
  static generateExportToken(questionnaireId: string, userId: string): string {
    const data = `${questionnaireId}:${userId}:${Date.now()}`;
    return this.encryptData(data);
  }

  /**
   * Validate export token
   */
  static validateExportToken(token: string): {
    isValid: boolean;
    questionnaireId?: string;
    userId?: string;
    timestamp?: number;
  } {
    try {
      const decryptedData = this.decryptData(token);
      const parts = decryptedData.split(':');
      
      if (parts.length !== 3) {
        return { isValid: false };
      }

      const [questionnaireId, userId, timestamp] = parts;
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (tokenAge > maxAge) {
        return { isValid: false };
      }

      return {
        isValid: true,
        questionnaireId,
        userId,
        timestamp: parseInt(timestamp)
      };
    } catch {
      return { isValid: false };
    }
  }

  /**
   * Rate limiting for API endpoints
   */
  static checkRateLimit(
    userId: string,
    action: string,
    windowMs: number = 60000, // 1 minute
    maxRequests: number = 100
  ): {
    allowed: boolean;
    remainingRequests: number;
    resetTime: number;
  } {
    // This is a simplified rate limiting implementation
    // In production, you would use Redis or a similar service
    // const key = `${userId}:${action}`; // Unused - would be used in production
    // const now = Date.now(); // Unused - would be used in production
    
    // For now, always allow (implement proper rate limiting in production)
    return {
      allowed: true,
      remainingRequests: maxRequests,
      resetTime: Date.now() + windowMs
    };
  }

  /**
   * Validate user permissions for questionnaire access
   */
  static validateQuestionnaireAccess(): Promise<boolean> {
    // This should integrate with your existing permission system
    // For now, return true (implement proper permission checking in production)
    return Promise.resolve(true);
  }

  /**
   * Encrypt sensitive questionnaire data before storage
   */
  static encryptQuestionnaireData(questionnaireData: Record<string, unknown>): Record<string, unknown> {
    const encryptedData = { ...questionnaireData };

    // Encrypt sensitive fields
    if (encryptedData.clientName) {
      encryptedData.clientName = this.encryptData(encryptedData.clientName as string);
    }

    if (encryptedData.description) {
      encryptedData.description = this.encryptData(encryptedData.description as string);
    }

    // Encrypt answers
    if (encryptedData.questions) {
      encryptedData.questions = (encryptedData.questions as Record<string, unknown>[]).map((question: Record<string, unknown>) => {
        if (question.answer && (question.answer as Record<string, unknown>).draftText) {
          (question.answer as Record<string, unknown>).draftText = this.encryptData((question.answer as Record<string, unknown>).draftText as string);
        }
        if (question.answer && (question.answer as Record<string, unknown>).finalText) {
          (question.answer as Record<string, unknown>).finalText = this.encryptData((question.answer as Record<string, unknown>).finalText as string);
        }
        return question;
      });
    }

    return encryptedData;
  }

  /**
   * Decrypt sensitive questionnaire data after retrieval
   */
  static decryptQuestionnaireData(questionnaireData: Record<string, unknown>): Record<string, unknown> {
    const decryptedData = { ...questionnaireData };

    // Decrypt sensitive fields
    if (decryptedData.clientName) {
      decryptedData.clientName = this.decryptData(decryptedData.clientName as string);
    }

    if (decryptedData.description) {
      decryptedData.description = this.decryptData(decryptedData.description as string);
    }

    // Decrypt answers
    if (decryptedData.questions) {
      decryptedData.questions = (decryptedData.questions as Record<string, unknown>[]).map((question: Record<string, unknown>) => {
        if (question.answer && (question.answer as Record<string, unknown>).draftText) {
          (question.answer as Record<string, unknown>).draftText = this.decryptData((question.answer as Record<string, unknown>).draftText as string);
        }
        if (question.answer && (question.answer as Record<string, unknown>).finalText) {
          (question.answer as Record<string, unknown>).finalText = this.decryptData((question.answer as Record<string, unknown>).finalText as string);
        }
        return question;
      });
    }

    return decryptedData;
  }
}
