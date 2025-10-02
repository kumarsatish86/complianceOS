import { prisma } from './prisma';
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';

// Lazy load pdf-parse to avoid file system access during build
let pdfParse: ((buffer: Buffer) => Promise<{text: string; numpages: number}>) | null = null;
const getPdfParse = () => {
  if (!pdfParse) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    pdfParse = require('pdf-parse');
  }
  return pdfParse;
};

export interface ParsedQuestion {
  section?: string;
  subsection?: string;
  orderIndex: number;
  questionText: string;
  questionType: 'TEXT_INPUT' | 'MULTIPLE_CHOICE' | 'YES_NO' | 'RATING_SCALE' | 'DATE_PICKER' | 'FILE_UPLOAD' | 'CHECKBOX_LIST' | 'DROPDOWN';
  optionsJson?: Record<string, unknown>;
  requiredFlag: boolean;
  controlMapping: string[];
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  keywordsExtracted: string[];
  dependencies?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ParsedQuestionnaire {
  title: string;
  description?: string;
  clientName?: string;
  frameworkMapping: string[];
  questions: ParsedQuestion[];
  metadata?: Record<string, unknown>;
}

export class DocumentParserService {
  /**
   * Parse uploaded document and extract questionnaire data
   */
  static async parseDocument(
    fileBuffer: Buffer,
    fileName: string,
    organizationId: string,
    uploadedBy: string
  ): Promise<ParsedQuestionnaire> {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    switch (fileExtension) {
      case 'xlsx':
      case 'xls':
        return this.parseExcelDocument(fileBuffer, organizationId, uploadedBy);
      case 'docx':
      case 'doc':
        return this.parseWordDocument(fileBuffer, organizationId, uploadedBy);
      case 'pdf':
        return this.parsePdfDocument(fileBuffer, organizationId, uploadedBy);
      default:
        throw new Error(`Unsupported file format: ${fileExtension}`);
    }
  }

  /**
   * Parse Excel document
   */
  private static async parseExcelDocument(
    fileBuffer: Buffer,
    organizationId: string, // Used for organization-specific parsing
    uploadedBy: string // Used for audit trail
  ): Promise<ParsedQuestionnaire> {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const questionnaire: ParsedQuestionnaire = {
        title: this.extractTitleFromExcel(data as unknown[][]),
        description: this.extractDescriptionFromExcel(data as unknown[][]),
        clientName: this.extractClientNameFromExcel(data as unknown[][]),
        frameworkMapping: this.extractFrameworkMappingFromExcel(data as unknown[][]),
        questions: this.extractQuestionsFromExcel(data as unknown[][]),
        metadata: {
          sourceFile: 'excel',
          parsedAt: new Date().toISOString(),
          totalRows: data.length,
          organizationId,
          uploadedBy
        }
      };

      return questionnaire;
    } catch (error) {
      throw new Error(`Failed to parse Excel document: ${error}`);
    }
  }

  /**
   * Parse Word document
   */
  private static async parseWordDocument(
    fileBuffer: Buffer,
    organizationId: string, // Used for organization-specific parsing
    uploadedBy: string // Used for audit trail
  ): Promise<ParsedQuestionnaire> {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const text = result.value;

      const questionnaire: ParsedQuestionnaire = {
        title: this.extractTitleFromText(text),
        description: this.extractDescriptionFromText(text),
        clientName: this.extractClientNameFromText(text),
        frameworkMapping: this.extractFrameworkMappingFromText(text),
        questions: this.extractQuestionsFromText(text),
        metadata: {
          sourceFile: 'word',
          parsedAt: new Date().toISOString(),
          wordCount: text.split(' ').length,
          organizationId,
          uploadedBy
        }
      };

      return questionnaire;
    } catch (error) {
      throw new Error(`Failed to parse Word document: ${error}`);
    }
  }

  /**
   * Parse PDF document
   */
  private static async parsePdfDocument(
    fileBuffer: Buffer,
    organizationId: string, // Used for organization-specific parsing
    uploadedBy: string // Used for audit trail
  ): Promise<ParsedQuestionnaire> {
    try {
      const parser = getPdfParse();
      if (!parser) {
        throw new Error('PDF parser not available');
      }
      const data = await parser(fileBuffer);
      const text = data.text;

      const questionnaire: ParsedQuestionnaire = {
        title: this.extractTitleFromText(text),
        description: this.extractDescriptionFromText(text),
        clientName: this.extractClientNameFromText(text),
        frameworkMapping: this.extractFrameworkMappingFromText(text),
        questions: this.extractQuestionsFromText(text),
        metadata: {
          sourceFile: 'pdf',
          parsedAt: new Date().toISOString(),
          pageCount: data.numpages,
          wordCount: text.split(' ').length,
          organizationId,
          uploadedBy
        }
      };

      return questionnaire;
    } catch (error) {
      throw new Error(`Failed to parse PDF document: ${error}`);
    }
  }

  /**
   * Extract title from Excel data
   */
  private static extractTitleFromExcel(data: unknown[][]): string {
    // Look for title in first few rows
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i];
      if (row && row[0] && typeof row[0] === 'string') {
        const cell = row[0].toString().trim();
        if (cell.length > 5 && cell.length < 100) {
          return cell;
        }
      }
    }
    return 'Security Questionnaire';
  }

  /**
   * Extract description from Excel data
   */
  private static extractDescriptionFromExcel(data: unknown[][]): string | undefined {
    // Look for description patterns
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row[0] && typeof row[0] === 'string') {
        const cell = row[0].toString().trim().toLowerCase();
        if (cell.includes('description') || cell.includes('overview')) {
          return row[1]?.toString() || undefined;
        }
      }
    }
    return undefined;
  }

  /**
   * Extract client name from Excel data
   */
  private static extractClientNameFromExcel(data: unknown[][]): string | undefined {
    // Look for client/company name patterns
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row[0] && typeof row[0] === 'string') {
        const cell = row[0].toString().trim().toLowerCase();
        if (cell.includes('client') || cell.includes('company') || cell.includes('organization')) {
          return row[1]?.toString() || undefined;
        }
      }
    }
    return undefined;
  }

  /**
   * Extract framework mapping from Excel data
   */
  private static extractFrameworkMappingFromExcel(data: unknown[][]): string[] {
    const frameworks: string[] = [];
    
    // Look for framework patterns
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row) {
        for (let j = 0; j < row.length; j++) {
          const cell = row[j]?.toString().trim().toLowerCase();
          if (cell) {
            if (cell.includes('iso 27001') || cell.includes('iso27001')) {
              frameworks.push('ISO 27001');
            } else if (cell.includes('soc 2') || cell.includes('soc2')) {
              frameworks.push('SOC 2');
            } else if (cell.includes('pci dss') || cell.includes('pci')) {
              frameworks.push('PCI DSS');
            } else if (cell.includes('gdpr')) {
              frameworks.push('GDPR');
            } else if (cell.includes('hipaa')) {
              frameworks.push('HIPAA');
            }
          }
        }
      }
    }

    return [...new Set(frameworks)]; // Remove duplicates
  }

  /**
   * Extract questions from Excel data
   */
  private static extractQuestionsFromExcel(data: unknown[][]): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    let currentSection = '';
    let questionIndex = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const firstCell = row[0]?.toString().trim();
      if (!firstCell) continue;

      // Check if this is a section header
      if (this.isSectionHeader(firstCell)) {
        currentSection = firstCell;
        continue;
      }

      // Check if this looks like a question
      if (this.isQuestion(firstCell)) {
        const question: ParsedQuestion = {
          section: currentSection || undefined,
          orderIndex: questionIndex++,
          questionText: firstCell,
          questionType: this.determineQuestionType(firstCell, row),
          requiredFlag: this.isRequiredQuestion(firstCell),
          controlMapping: this.extractControlMapping(firstCell),
          riskLevel: this.determineRiskLevel(firstCell),
          keywordsExtracted: this.extractKeywords(firstCell),
          metadata: {
            sourceRow: i + 1,
            sourceColumn: 1
          }
        };

        // Extract options if it's a multiple choice question
        if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'DROPDOWN') {
          question.optionsJson = this.extractOptionsFromRow(row);
        }

        questions.push(question);
      }
    }

    return questions;
  }

  /**
   * Extract title from text
   */
  private static extractTitleFromText(text: string): string {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Look for title in first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (line.length > 5 && line.length < 100 && !line.includes('?')) {
        return line;
      }
    }
    
    return 'Security Questionnaire';
  }

  /**
   * Extract description from text
   */
  private static extractDescriptionFromText(text: string): string | undefined {
    const lines = text.split('\n').map(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('description') || line.includes('overview') || line.includes('purpose')) {
        return lines[i + 1] || undefined;
      }
    }
    
    return undefined;
  }

  /**
   * Extract client name from text
   */
  private static extractClientNameFromText(text: string): string | undefined {
    const lines = text.split('\n').map(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('client') || line.includes('company') || line.includes('organization')) {
        return lines[i + 1] || undefined;
      }
    }
    
    return undefined;
  }

  /**
   * Extract framework mapping from text
   */
  private static extractFrameworkMappingFromText(text: string): string[] {
    const frameworks: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('iso 27001') || lowerText.includes('iso27001')) {
      frameworks.push('ISO 27001');
    }
    if (lowerText.includes('soc 2') || lowerText.includes('soc2')) {
      frameworks.push('SOC 2');
    }
    if (lowerText.includes('pci dss') || lowerText.includes('pci')) {
      frameworks.push('PCI DSS');
    }
    if (lowerText.includes('gdpr')) {
      frameworks.push('GDPR');
    }
    if (lowerText.includes('hipaa')) {
      frameworks.push('HIPAA');
    }
    
    return frameworks;
  }

  /**
   * Extract questions from text
   */
  private static extractQuestionsFromText(text: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentSection = '';
    let questionIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this is a section header
      if (this.isSectionHeader(line)) {
        currentSection = line;
        continue;
      }

      // Check if this looks like a question
      if (this.isQuestion(line)) {
        const question: ParsedQuestion = {
          section: currentSection || undefined,
          orderIndex: questionIndex++,
          questionText: line,
          questionType: this.determineQuestionType(line),
          requiredFlag: this.isRequiredQuestion(line),
          controlMapping: this.extractControlMapping(line),
          riskLevel: this.determineRiskLevel(line),
          keywordsExtracted: this.extractKeywords(line),
          metadata: {
            sourceLine: i + 1
          }
        };

        questions.push(question);
      }
    }

    return questions;
  }

  /**
   * Check if text is a section header
   */
  private static isSectionHeader(text: string): boolean {
    const lowerText = text.toLowerCase();
    return (
      lowerText.includes('section') ||
      lowerText.includes('chapter') ||
      lowerText.includes('part') ||
      (text.length < 50 && !text.includes('?') && !text.includes('.'))
    );
  }

  /**
   * Check if text is a question
   */
  private static isQuestion(text: string): boolean {
    return (
      text.includes('?') ||
      text.toLowerCase().includes('describe') ||
      text.toLowerCase().includes('explain') ||
      text.toLowerCase().includes('list') ||
      text.toLowerCase().includes('provide')
    );
  }

  /**
   * Determine question type based on text
   */
  private static determineQuestionType(text: string, row?: unknown[]): 'TEXT_INPUT' | 'MULTIPLE_CHOICE' | 'YES_NO' | 'RATING_SCALE' | 'DATE_PICKER' | 'FILE_UPLOAD' | 'CHECKBOX_LIST' | 'DROPDOWN' {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('yes') && lowerText.includes('no')) {
      return 'YES_NO';
    }
    if (lowerText.includes('rate') || lowerText.includes('scale')) {
      return 'RATING_SCALE';
    }
    if (lowerText.includes('date') || lowerText.includes('when')) {
      return 'DATE_PICKER';
    }
    if (lowerText.includes('file') || lowerText.includes('upload') || lowerText.includes('attach')) {
      return 'FILE_UPLOAD';
    }
    if (lowerText.includes('select') || lowerText.includes('choose')) {
      return 'DROPDOWN';
    }
    if (lowerText.includes('check') || lowerText.includes('tick')) {
      return 'CHECKBOX_LIST';
    }
    if (row && row.length > 1) {
      // Check if there are multiple options in the row
      const options = row.slice(1).filter(cell => cell && cell.toString().trim().length > 0);
      if (options.length > 1) {
        return 'MULTIPLE_CHOICE';
      }
    }

    return 'TEXT_INPUT';
  }

  /**
   * Check if question is required
   */
  private static isRequiredQuestion(text: string): boolean {
    const lowerText = text.toLowerCase();
    return (
      lowerText.includes('required') ||
      lowerText.includes('mandatory') ||
      lowerText.includes('must') ||
      text.includes('*')
    );
  }

  /**
   * Extract control mapping from question text
   */
  private static extractControlMapping(text: string): string[] {
    const controls: string[] = [];
    const lowerText = text.toLowerCase();

    // Map common security domains to control IDs
    if (lowerText.includes('access') || lowerText.includes('authentication')) {
      controls.push('AC-1', 'AC-2', 'AC-3');
    }
    if (lowerText.includes('encryption') || lowerText.includes('cryptographic')) {
      controls.push('SC-1', 'SC-2', 'SC-3');
    }
    if (lowerText.includes('incident') || lowerText.includes('response')) {
      controls.push('IR-1', 'IR-2', 'IR-3');
    }
    if (lowerText.includes('audit') || lowerText.includes('logging')) {
      controls.push('AU-1', 'AU-2', 'AU-3');
    }
    if (lowerText.includes('backup') || lowerText.includes('recovery')) {
      controls.push('CP-1', 'CP-2', 'CP-3');
    }

    return controls;
  }

  /**
   * Determine risk level from question text
   */
  private static determineRiskLevel(text: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('critical') || lowerText.includes('essential') || lowerText.includes('vital')) {
      return 'CRITICAL';
    }
    if (lowerText.includes('high') || lowerText.includes('important') || lowerText.includes('sensitive')) {
      return 'HIGH';
    }
    if (lowerText.includes('medium') || lowerText.includes('moderate')) {
      return 'MEDIUM';
    }
    if (lowerText.includes('low') || lowerText.includes('basic')) {
      return 'LOW';
    }

    return undefined;
  }

  /**
   * Extract keywords from question text
   */
  private static extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    const securityKeywords = [
      'security', 'access', 'authentication', 'authorization', 'encryption',
      'incident', 'audit', 'backup', 'recovery', 'network', 'firewall',
      'vulnerability', 'patch', 'update', 'monitoring', 'logging',
      'compliance', 'policy', 'procedure', 'training', 'awareness'
    ];

    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (securityKeywords.includes(cleanWord)) {
        keywords.push(cleanWord);
      }
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Extract options from Excel row
   */
  private static extractOptionsFromRow(row: unknown[]): Record<string, unknown> {
    const options = row.slice(1).filter(cell => cell && cell.toString().trim().length > 0);
    return {
      options: options.map((option: unknown) => ({
        value: (option as string).toString().trim(),
        label: (option as string).toString().trim()
      }))
    };
  }

  /**
   * Save parsed questionnaire to database
   */
  static async saveParsedQuestionnaire(
    parsedData: ParsedQuestionnaire,
    organizationId: string,
    uploadedBy: string,
    sourceFileId?: string
  ): Promise<string> {
    try {
      // Create questionnaire
      const questionnaire = await prisma.questionnaire.create({
        data: {
          organizationId,
          title: parsedData.title,
          description: parsedData.description,
          sourceFileId,
          clientName: parsedData.clientName,
          frameworkMapping: parsedData.frameworkMapping,
          uploadedBy,
          status: 'PARSED',
          totalQuestions: parsedData.questions.length,
          metadata: JSON.parse(JSON.stringify(parsedData.metadata))
        }
      });

      // Create questions
      for (const questionData of parsedData.questions) {
        await prisma.question.create({
          data: {
            questionnaireId: questionnaire.id,
            section: questionData.section,
            subsection: questionData.subsection,
            orderIndex: questionData.orderIndex,
            questionText: questionData.questionText,
            questionType: questionData.questionType,
            optionsJson: JSON.parse(JSON.stringify(questionData.optionsJson)),
            requiredFlag: questionData.requiredFlag,
            controlMapping: questionData.controlMapping,
            riskLevel: questionData.riskLevel,
            keywordsExtracted: questionData.keywordsExtracted,
            dependencies: JSON.parse(JSON.stringify(questionData.dependencies)),
            metadata: JSON.parse(JSON.stringify(questionData.metadata))
          }
        });
      }

      // Create activity log
      await prisma.questionnaireActivity.create({
        data: {
          questionnaireId: questionnaire.id,
          userId: uploadedBy,
          activityType: 'PARSED',
          description: `Parsed ${parsedData.questions.length} questions from document`,
          metadata: JSON.parse(JSON.stringify({
            sourceFile: parsedData.metadata?.sourceFile,
            parsedAt: parsedData.metadata?.parsedAt
          }))
        }
      });

      return questionnaire.id;
    } catch (error) {
      throw new Error(`Failed to save parsed questionnaire: ${error}`);
    }
  }
}
