import { aiService } from './ai-service';

export interface ContentGenerationRequest {
  organizationId: string;
  userId: string;
  contentType: 'POLICY' | 'PROCEDURE' | 'EVIDENCE_DESCRIPTION' | 'RISK_ASSESSMENT' | 'AUDIT_NARRATIVE';
  context: Record<string, unknown>;
  template?: string;
  customInstructions?: string;
}

export interface GeneratedContent {
  id: string;
  content: string;
  confidence: number;
  sources: Record<string, unknown>[];
  metadata: Record<string, unknown>;
}

export class AIContentGenerator {
  /**
   * Generate policy content using AI
   */
  async generatePolicy(request: ContentGenerationRequest): Promise<GeneratedContent> {
    try {
      const prompt = this.buildPolicyPrompt(request);
      
      const response = await aiService.processQuery({
        organizationId: request.organizationId,
        userId: request.userId,
        queryText: prompt,
        context: request.context,
      });

      return {
        id: response.id,
        content: response.responseText,
        confidence: response.confidenceScore,
        sources: response.contextSources,
        metadata: {
          type: 'POLICY',
          generatedAt: new Date(),
          model: 'gpt-4',
        },
      };
    } catch (error) {
      console.error('Policy generation error:', error);
      throw new Error('Failed to generate policy content');
    }
  }

  /**
   * Generate evidence descriptions using AI
   */
  async generateEvidenceDescription(request: ContentGenerationRequest): Promise<GeneratedContent> {
    try {
      const prompt = this.buildEvidencePrompt(request);
      
      const response = await aiService.processQuery({
        organizationId: request.organizationId,
        userId: request.userId,
        queryText: prompt,
        context: request.context,
      });

      return {
        id: response.id,
        content: response.responseText,
        confidence: response.confidenceScore,
        sources: response.contextSources,
        metadata: {
          type: 'EVIDENCE_DESCRIPTION',
          generatedAt: new Date(),
          model: 'gpt-4',
        },
      };
    } catch (error) {
      console.error('Evidence description generation error:', error);
      throw new Error('Failed to generate evidence description');
    }
  }

  /**
   * Generate risk assessment content using AI
   */
  async generateRiskAssessment(request: ContentGenerationRequest): Promise<GeneratedContent> {
    try {
      const prompt = this.buildRiskAssessmentPrompt(request);
      
      const response = await aiService.processQuery({
        organizationId: request.organizationId,
        userId: request.userId,
        queryText: prompt,
        context: request.context,
      });

      return {
        id: response.id,
        content: response.responseText,
        confidence: response.confidenceScore,
        sources: response.contextSources,
        metadata: {
          type: 'RISK_ASSESSMENT',
          generatedAt: new Date(),
          model: 'gpt-4',
        },
      };
    } catch (error) {
      console.error('Risk assessment generation error:', error);
      throw new Error('Failed to generate risk assessment');
    }
  }

  /**
   * Generate audit narrative using AI
   */
  async generateAuditNarrative(request: ContentGenerationRequest): Promise<GeneratedContent> {
    try {
      const prompt = this.buildAuditNarrativePrompt(request);
      
      const response = await aiService.processQuery({
        organizationId: request.organizationId,
        userId: request.userId,
        queryText: prompt,
        context: request.context,
      });

      return {
        id: response.id,
        content: response.responseText,
        confidence: response.confidenceScore,
        sources: response.contextSources,
        metadata: {
          type: 'AUDIT_NARRATIVE',
          generatedAt: new Date(),
          model: 'gpt-4',
        },
      };
    } catch (error) {
      console.error('Audit narrative generation error:', error);
      throw new Error('Failed to generate audit narrative');
    }
  }

  /**
   * Generate questionnaire answers using AI
   */
  async generateQuestionnaireAnswer(
    organizationId: string,
    userId: string,
    question: string,
    context: Record<string, unknown>
  ): Promise<GeneratedContent> {
    try {
      const prompt = `Based on our organization's compliance posture, provide a comprehensive answer to this security questionnaire question:

Question: ${question}

Context: ${JSON.stringify(context, null, 2)}

Please provide:
1. A direct answer to the question
2. Supporting evidence references
3. Implementation details
4. Any relevant policies or procedures

Format the response professionally for a security questionnaire.`;
      
      const response = await aiService.processQuery({
        organizationId,
        userId,
        queryText: prompt,
        context,
      });

      return {
        id: response.id,
        content: response.responseText,
        confidence: response.confidenceScore,
        sources: response.contextSources,
        metadata: {
          type: 'QUESTIONNAIRE_ANSWER',
          generatedAt: new Date(),
          model: 'gpt-4',
        },
      };
    } catch (error) {
      console.error('Questionnaire answer generation error:', error);
      throw new Error('Failed to generate questionnaire answer');
    }
  }

  /**
   * Build policy generation prompt
   */
  private buildPolicyPrompt(request: ContentGenerationRequest): string {
    const { context, template, customInstructions } = request;
    
    let prompt = `Generate a comprehensive policy document based on the following requirements:

Context: ${JSON.stringify(context, null, 2)}

Requirements:
- Follow industry best practices
- Include clear objectives and scope
- Define roles and responsibilities
- Include implementation guidelines
- Add compliance requirements
- Include review and update procedures`;

    if (template) {
      prompt += `\n\nUse this template structure: ${template}`;
    }

    if (customInstructions) {
      prompt += `\n\nAdditional instructions: ${customInstructions}`;
    }

    prompt += `\n\nFormat the policy as a professional document with clear sections and subsections.`;

    return prompt;
  }

  /**
   * Build evidence description prompt
   */
  private buildEvidencePrompt(request: ContentGenerationRequest): string {
    const { context } = request;
    
    return `Generate a comprehensive evidence description for compliance purposes:

Context: ${JSON.stringify(context, null, 2)}

Please provide:
1. A clear description of the evidence
2. How it demonstrates compliance
3. The control it supports
4. Implementation details
5. Review and approval process
6. Retention requirements

Format this as a professional evidence description suitable for audit purposes.`;
  }

  /**
   * Build risk assessment prompt
   */
  private buildRiskAssessmentPrompt(request: ContentGenerationRequest): string {
    const { context } = request;
    
    return `Generate a comprehensive risk assessment based on the following information:

Context: ${JSON.stringify(context, null, 2)}

Please provide:
1. Risk identification and description
2. Likelihood and impact assessment
3. Risk rating and justification
4. Existing controls analysis
5. Residual risk assessment
6. Treatment recommendations
7. Monitoring and review requirements

Format this as a professional risk assessment document.`;
  }

  /**
   * Build audit narrative prompt
   */
  private buildAuditNarrativePrompt(request: ContentGenerationRequest): string {
    const { context } = request;
    
    return `Generate a professional audit narrative based on the following audit information:

Context: ${JSON.stringify(context, null, 2)}

Please provide:
1. Executive summary of findings
2. Detailed control testing results
3. Evidence evaluation
4. Compliance assessment
5. Identified gaps or issues
6. Recommendations for improvement
7. Management response requirements

Format this as a professional audit narrative suitable for management and auditor review.`;
  }

  /**
   * Get content generation templates
   */
  async getTemplates(contentType: string): Promise<Record<string, unknown>[]> {
    const templates = {
      POLICY: [
        {
          name: 'Information Security Policy',
          description: 'Comprehensive information security policy template',
          sections: ['Purpose', 'Scope', 'Roles', 'Controls', 'Incident Response', 'Review'],
        },
        {
          name: 'Access Control Policy',
          description: 'User access management policy template',
          sections: ['User Management', 'Access Rights', 'Authentication', 'Authorization', 'Review'],
        },
        {
          name: 'Data Protection Policy',
          description: 'Data privacy and protection policy template',
          sections: ['Data Classification', 'Handling', 'Retention', 'Disposal', 'Breach Response'],
        },
      ],
      PROCEDURE: [
        {
          name: 'Incident Response Procedure',
          description: 'Step-by-step incident response procedure',
          sections: ['Detection', 'Assessment', 'Containment', 'Recovery', 'Lessons Learned'],
        },
        {
          name: 'Access Review Procedure',
          description: 'User access review and certification procedure',
          sections: ['Preparation', 'Review', 'Certification', 'Remediation', 'Documentation'],
        },
      ],
      EVIDENCE_DESCRIPTION: [
        {
          name: 'Control Implementation Evidence',
          description: 'Evidence description for control implementation',
          sections: ['Implementation', 'Testing', 'Monitoring', 'Review'],
        },
        {
          name: 'Policy Compliance Evidence',
          description: 'Evidence description for policy compliance',
          sections: ['Policy', 'Implementation', 'Monitoring', 'Compliance'],
        },
      ],
    };

    return templates[contentType as keyof typeof templates] || [];
  }
}

export const aiContentGenerator = new AIContentGenerator();
