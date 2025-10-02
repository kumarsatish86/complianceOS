import { prisma } from './prisma';
import { QuestionnaireSecurityService } from './questionnaire-security';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

export interface ExportOptions {
  format: 'EXCEL' | 'WORD' | 'PDF' | 'CSV' | 'ZIP_PACKAGE';
  includeAnswers: boolean;
  includeEvidence: boolean;
  includeMetadata: boolean;
  includeReviewHistory: boolean;
  template?: string;
  customFields?: string[];
}

export interface ExportResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  expiresAt: Date;
  integrityHash: string;
}

export class QuestionnaireExportService {
  /**
   * Export questionnaire in specified format
   */
  static async exportQuestionnaire(
    questionnaireId: string,
    userId: string,
    _options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Get questionnaire data
      const questionnaire = await prisma.questionnaire.findUnique({
        where: { id: questionnaireId },
        include: {
          questions: {
            include: {
              answers: {
                include: {
                  reviewer: { select: { name: true, email: true } },
                  approver: { select: { name: true, email: true } }
                }
              }
            },
            orderBy: { orderIndex: 'asc' }
          },
          uploader: { select: { name: true, email: true } },
          assignee: { select: { name: true, email: true } },
          organization: { select: { name: true } }
        }
      });

      if (!questionnaire) {
        throw new Error('Questionnaire not found');
      }

      // Generate export based on format
      let exportResult: ExportResult;
      switch (_options.format) {
        case 'EXCEL':
          exportResult = await this.exportToExcel(questionnaire);
          break;
        case 'PDF':
          exportResult = await this.exportToPDF(questionnaire);
          break;
        case 'CSV':
          exportResult = await this.exportToCSV(questionnaire);
          break;
        case 'WORD':
          exportResult = await this.exportToWord(questionnaire);
          break;
        case 'ZIP_PACKAGE':
          exportResult = await this.exportToZipPackage(questionnaire);
          break;
        default:
          throw new Error(`Unsupported export format: ${_options.format}`);
      }

      // Save export record
      await prisma.questionnaireExport.create({
        data: {
          questionnaireId,
          exportType: _options.format,
          fileId: exportResult.fileId,
          exportedBy: userId,
          integrityHash: exportResult.integrityHash,
          expiryDate: exportResult.expiresAt,
          metadata: JSON.parse(JSON.stringify({
            _options,
            exportedAt: new Date().toISOString(),
            fileSize: exportResult.fileSize
          })),
        }
      });

      return exportResult;
    } catch (_error) {
      throw new Error(`Failed to export questionnaire: ${_error}`);
    }
  }

  /**
   * Export to Excel format
   */
  private static async exportToExcel(questionnaire: Record<string, unknown>): Promise<ExportResult> {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Questionnaire Title', (questionnaire as Record<string, unknown>).title as string],
      ['Client Name', (questionnaire as Record<string, unknown>).clientName as string || 'N/A'],
      ['Organization', (questionnaire as Record<string, unknown>).organization ? ((questionnaire as Record<string, unknown>).organization as Record<string, unknown>).name as string : 'N/A'],
      ['Status', (questionnaire as Record<string, unknown>).status as string],
      ['Total Questions', (questionnaire as Record<string, unknown>).totalQuestions as number],
      ['Completed Questions', (questionnaire as Record<string, unknown>).completedQuestions as number],
      ['Completion Rate', `${Math.round((((questionnaire as Record<string, unknown>).completedQuestions as number) / ((questionnaire as Record<string, unknown>).totalQuestions as number)) * 100)}%`],
      ['Uploaded By', (questionnaire as Record<string, unknown>).uploader ? ((questionnaire as Record<string, unknown>).uploader as Record<string, unknown>).name as string || ((questionnaire as Record<string, unknown>).uploader as Record<string, unknown>).email as string : 'N/A'],
      ['Assigned To', (questionnaire as Record<string, unknown>).assignee ? ((questionnaire as Record<string, unknown>).assignee as Record<string, unknown>).name as string || ((questionnaire as Record<string, unknown>).assignee as Record<string, unknown>).email as string || 'N/A' : 'N/A'],
      ['Created Date', ((questionnaire as Record<string, unknown>).createdAt as Date).toISOString().split('T')[0]],
      ['Last Updated', ((questionnaire as Record<string, unknown>).updatedAt as Date).toISOString().split('T')[0]]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Questions sheet
    const questionsData = [
      ['Question #', 'Section', 'Question Text', 'Type', 'Required', 'Risk Level', 'Answer Status', 'Answer Text', 'Evidence IDs', 'Reviewer', 'Approver', 'Submitted Date', 'Approved Date']
    ];

    ((questionnaire as Record<string, unknown>).questions as Record<string, unknown>[]).forEach((question: Record<string, unknown>, index: number) => {
      const answer = (question.answers as Record<string, unknown>[])[0];
      questionsData.push([
        (index + 1).toString(),
        (question.section as string) || '',
        question.questionText as string,
        question.questionType as string,
        (question.requiredFlag as boolean) ? 'Yes' : 'No',
        (question.riskLevel as string) || '',
        (answer?.status as string) || 'Not Answered',
        (answer?.finalText as string) || (answer?.draftText as string) || '',
        (answer?.evidenceIds as string[])?.join(';') || '',
        (answer?.reviewer as Record<string, unknown>)?.name as string || '',
        (answer?.approver as Record<string, unknown>)?.name as string || '',
        answer?.submittedAt ? (answer.submittedAt as Date).toISOString().split('T')[0] : '',
        answer?.approvedAt ? (answer.approvedAt as Date).toISOString().split('T')[0] : ''
      ]);
    });

    const questionsSheet = XLSX.utils.aoa_to_sheet(questionsData);
    XLSX.utils.book_append_sheet(workbook, questionsSheet, 'Questions');

    // Generate file
    const fileName = `questionnaire-${(questionnaire.title as string).replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.xlsx`;
    const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return {
      fileId: this.generateFileId(),
      fileName,
      fileSize: fileBuffer.length,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      downloadUrl: this.generateDownloadUrl(fileName),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      integrityHash: QuestionnaireSecurityService.hashData(fileBuffer.toString())
    };
  }

  /**
   * Export to PDF format
   */
  private static async exportToPDF(questionnaire: Record<string, unknown>): Promise<ExportResult> {
    const doc = new PDFDocument();
    const fileName = `questionnaire-${(questionnaire.title as string).replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`;
    
    // Add content to PDF
    doc.fontSize(20).text(questionnaire.title as string, { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Client: ${(questionnaire.clientName as string) || 'N/A'}`, { align: 'left' });
    doc.text(`Organization: ${((questionnaire.organization as Record<string, unknown>).name as string)}`, { align: 'left' });
    doc.text(`Status: ${(questionnaire.status as string)}`, { align: 'left' });
    doc.text(`Completion: ${(questionnaire.completedQuestions as number)}/${(questionnaire.totalQuestions as number)} questions`, { align: 'left' });
    doc.moveDown();

    // Add questions
    doc.fontSize(16).text('Questions and Answers', { align: 'center' });
    doc.moveDown();

    ((questionnaire as Record<string, unknown>).questions as Record<string, unknown>[]).forEach((question: Record<string, unknown>, index: number) => {
      doc.fontSize(14).text(`Q${index + 1}: ${question.questionText as string}`, { align: 'left' });
      
      if (question.section) {
        doc.fontSize(10).text(`Section: ${question.section as string}`, { align: 'left' });
      }
      
      const answer = (question.answers as Record<string, unknown>[])[0];
      if (answer) {
        doc.fontSize(12).text(`Answer: ${(answer.finalText as string) || (answer.draftText as string) || 'No answer provided'}`, { align: 'left' });
        doc.fontSize(10).text(`Status: ${answer.status as string}`, { align: 'left' });
        
        if (answer.reviewer) {
          doc.text(`Reviewed by: ${(answer.reviewer as Record<string, unknown>).name as string}`, { align: 'left' });
        }
        if (answer.approvedAt) {
          doc.text(`Approved: ${(answer.approvedAt as Date).toISOString().split('T')[0]}`, { align: 'left' });
        }
      } else {
        doc.fontSize(12).text('Answer: Not answered', { align: 'left' });
      }
      
      doc.moveDown(0.5);
    });

    // Generate file buffer
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const fileBuffer = Buffer.concat(chunks);
        resolve({
          fileId: this.generateFileId(),
          fileName,
          fileSize: fileBuffer.length,
          mimeType: 'application/pdf',
          downloadUrl: this.generateDownloadUrl(fileName),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          integrityHash: QuestionnaireSecurityService.hashData(fileBuffer.toString())
        });
      });
      
      doc.on('_error', reject);
      doc.end();
    });
  }

  /**
   * Export to CSV format
   */
  private static async exportToCSV(questionnaire: Record<string, unknown>): Promise<ExportResult> {
    const csvLines = [
      'Question #,Section,Question Text,Type,Required,Risk Level,Answer Status,Answer Text,Evidence IDs,Reviewer,Approver,Submitted Date,Approved Date'
    ];

    ((questionnaire as Record<string, unknown>).questions as Record<string, unknown>[]).forEach((question: Record<string, unknown>, index: number) => {
      const answer = (question.answers as Record<string, unknown>[])[0];
      const row = [
        (index + 1).toString(),
        (question.section as string) || '',
        `"${(question.questionText as string).replace(/"/g, '""')}"`, // Escape quotes
        question.questionType as string,
        (question.requiredFlag as boolean) ? 'Yes' : 'No',
        (question.riskLevel as string) || '',
        (answer?.status as string) || 'Not Answered',
        `"${((answer?.finalText as string) || (answer?.draftText as string) || '').replace(/"/g, '""')}"`, // Escape quotes
        (answer?.evidenceIds as string[])?.join(';') || '',
        (answer?.reviewer as Record<string, unknown>)?.name as string || '',
        (answer?.approver as Record<string, unknown>)?.name as string || '',
        answer?.submittedAt ? (answer.submittedAt as Date).toISOString().split('T')[0] : '',
        answer?.approvedAt ? (answer.approvedAt as Date).toISOString().split('T')[0] : ''
      ];
      csvLines.push(row.join(','));
    });

    const csvContent = csvLines.join('\n');
    const fileName = `questionnaire-${(questionnaire.title as string).replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.csv`;
    const fileBuffer = Buffer.from(csvContent, 'utf8');

    return {
      fileId: this.generateFileId(),
      fileName,
      fileSize: fileBuffer.length,
      mimeType: 'text/csv',
      downloadUrl: this.generateDownloadUrl(fileName),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      integrityHash: QuestionnaireSecurityService.hashData(csvContent)
    };
  }

  /**
   * Export to Word format (simplified implementation)
   */
  private static async exportToWord(questionnaire: Record<string, unknown>): Promise<ExportResult> {
    // For now, we'll create a simple text-based Word document
    // In production, you would use a proper Word library like docx
    const wordContent = `
QUESTIONNAIRE REPORT
===================

Title: ${questionnaire.title as string}
Client: ${(questionnaire.clientName as string) || 'N/A'}
Organization: ${((questionnaire.organization as Record<string, unknown>).name as string)}
Status: ${questionnaire.status as string}
Completion: ${(questionnaire.completedQuestions as number)}/${(questionnaire.totalQuestions as number)} questions

QUESTIONS AND ANSWERS
====================

${((questionnaire as Record<string, unknown>).questions as Record<string, unknown>[]).map((question: Record<string, unknown>, index: number) => {
  const answer = (question.answers as Record<string, unknown>[])[0];
  return `
Q${index + 1}: ${question.questionText as string}
${question.section ? `Section: ${question.section as string}` : ''}
Answer: ${(answer?.finalText as string) || (answer?.draftText as string) || 'Not answered'}
Status: ${answer?.status as string || 'Not Answered'}
${answer?.reviewer ? `Reviewed by: ${(answer.reviewer as Record<string, unknown>).name as string}` : ''}
${answer?.approvedAt ? `Approved: ${(answer.approvedAt as Date).toISOString().split('T')[0]}` : ''}
`;
}).join('\n')}
    `.trim();

    const fileName = `questionnaire-${(questionnaire.title as string).replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.docx`;
    const fileBuffer = Buffer.from(wordContent, 'utf8');

    return {
      fileId: this.generateFileId(),
      fileName,
      fileSize: fileBuffer.length,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      downloadUrl: this.generateDownloadUrl(fileName),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      integrityHash: QuestionnaireSecurityService.hashData(wordContent)
    };
  }

  /**
   * Export to ZIP package with multiple files
   */
  private static async exportToZipPackage(questionnaire: Record<string, unknown>): Promise<ExportResult> {
    // This would create a ZIP file containing multiple formats
    // For now, we'll create a simple text file listing all components
    const packageContent = `
QUESTIONNAIRE PACKAGE
====================

Questionnaire: ${questionnaire.title as string}
Client: ${(questionnaire.clientName as string) || 'N/A'}
Organization: ${((questionnaire.organization as Record<string, unknown>).name as string)}
Export Date: ${new Date().toISOString()}

CONTENTS:
- Summary Report
- Questions and Answers (Excel)
- Questions and Answers (PDF)
- Questions and Answers (CSV)
- Evidence Documents (if applicable)

STATISTICS:
- Total Questions: ${questionnaire.totalQuestions as number}
- Completed Questions: ${questionnaire.completedQuestions as number}
- Completion Rate: ${Math.round(((questionnaire.completedQuestions as number) / (questionnaire.totalQuestions as number)) * 100)}%
- Status: ${questionnaire.status as string}

This package contains all questionnaire data and supporting documentation.
    `.trim();

    const fileName = `questionnaire-package-${(questionnaire.title as string).replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.zip`;
    const fileBuffer = Buffer.from(packageContent, 'utf8');

    return {
      fileId: this.generateFileId(),
      fileName,
      fileSize: fileBuffer.length,
      mimeType: 'application/zip',
      downloadUrl: this.generateDownloadUrl(fileName),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      integrityHash: QuestionnaireSecurityService.hashData(packageContent)
    };
  }

  /**
   * Generate unique file ID
   */
  private static generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate download URL
   */
  private static generateDownloadUrl(fileName: string): string {
    return `/api/admin/questionnaires/download/${fileName}`;
  }

  /**
   * Get export history for questionnaire
   */
  static async getExportHistory(questionnaireId: string): Promise<Record<string, unknown>[]> {
    try {
      const exports = await prisma.questionnaireExport.findMany({
        where: { questionnaireId },
        include: {
          exporter: {
            select: { name: true, email: true }
          }
        },
        orderBy: { exportedAt: 'desc' }
      });

      return exports.map(exp => ({
        id: exp.id,
        exportType: exp.exportType,
        fileName: exp.fileId,
        exportedBy: exp.exporter?.name || exp.exporter?.email,
        exportedAt: exp.exportedAt,
        downloadCount: exp.downloadCount,
        expiryDate: exp.expiryDate,
        isExpired: exp.expiryDate ? exp.expiryDate < new Date() : false
      }));
    } catch (_error) {
      throw new Error(`Failed to get export history: ${_error}`);
    }
  }

  /**
   * Validate export token and get file
   */
  static async validateExportToken(token: string): Promise<{
    isValid: boolean;
    questionnaireId?: string;
    userId?: string;
    fileId?: string;
  }> {
    try {
      const validation = QuestionnaireSecurityService.validateExportToken(token);
      
      if (!validation.isValid) {
        return { isValid: false };
      }

      // In a real implementation, you would:
      // 1. Look up the file in your storage system
      // 2. Verify the user has permission to access it
      // 3. Return the file data

      return {
        isValid: true,
        questionnaireId: validation.questionnaireId,
        userId: validation.userId,
        fileId: 'placeholder-file-id'
      };
    } catch {
      return { isValid: false };
    }
  }
}
