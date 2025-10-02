const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateAIData() {
  console.log('🤖 Starting AI Assistance Layer data population...');

  try {
    // Check if we have an organization
    let organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log('   Creating default organization...');
      organization = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default-org',
          domain: 'default.com',
          status: 'active',
          plan: 'enterprise',
          description: 'Default organization for AI Assistant testing',
        },
      });
    }

    // Check if we have a user
    let user = await prisma.user.findFirst();
    if (!user) {
      console.log('   Creating default user...');
      user = await prisma.user.create({
        data: {
          name: 'AI Test User',
          email: 'ai-test@example.com',
          password: 'hashed-password',
        },
      });
    }

    console.log('   Creating AI models...');
    
    // Create AI models
    const models = [
      {
        modelName: 'gpt-4',
        modelVersion: '4.0',
        provider: 'OPENAI',
        capabilities: ['TEXT_GENERATION', 'TEXT_ANALYSIS', 'QUESTION_ANSWERING'],
        costPerToken: 0.00003,
        performanceMetrics: {
          accuracy: 0.95,
          speed: 1.2,
          reliability: 0.99,
        },
        activeFlag: true,
      },
      {
        modelName: 'text-embedding-ada-002',
        modelVersion: '2.0',
        provider: 'OPENAI',
        capabilities: ['EMBEDDING_GENERATION'],
        costPerToken: 0.0000001,
        performanceMetrics: {
          accuracy: 0.92,
          speed: 0.8,
          reliability: 0.98,
        },
        activeFlag: true,
      },
      {
        modelName: 'claude-3-sonnet',
        modelVersion: '3.0',
        provider: 'ANTHROPIC',
        capabilities: ['TEXT_GENERATION', 'TEXT_ANALYSIS', 'SUMMARIZATION'],
        costPerToken: 0.000015,
        performanceMetrics: {
          accuracy: 0.94,
          speed: 1.5,
          reliability: 0.97,
        },
        activeFlag: true,
      },
    ];

    for (const modelData of models) {
      // Check if model already exists
      const existingModel = await prisma.aIModel.findFirst({
        where: {
          modelName: modelData.modelName,
          modelVersion: modelData.modelVersion,
        },
      });

      if (existingModel) {
        await prisma.aIModel.update({
          where: { id: existingModel.id },
          data: modelData,
        });
      } else {
        await prisma.aIModel.create({
          data: modelData,
        });
      }
    }

    console.log('   Creating AI sessions...');
    
    // Create sample AI sessions
    const sessions = [
      {
        organizationId: organization.id,
        userId: user.id,
        sessionTitle: 'Evidence Management Help',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        lastActivity: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        queryCount: 5,
        contextWindow: {
          lastQuery: 'Show me all Access Control evidence',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
      },
      {
        organizationId: organization.id,
        userId: user.id,
        sessionTitle: 'Policy Analysis Session',
        startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        lastActivity: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        queryCount: 3,
        contextWindow: {
          lastQuery: 'Analyze our information security policy',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
      },
    ];

    const createdSessions = [];
    for (const sessionData of sessions) {
      const session = await prisma.aISession.create({
        data: sessionData,
      });
      createdSessions.push(session);
    }

    console.log('   Creating AI queries...');
    
    // Create sample AI queries
    const queries = [
      {
        organizationId: organization.id,
        userId: user.id,
        sessionId: createdSessions[0].id,
        queryText: 'Show me all Access Control evidence',
        responseText: 'I found 12 Access Control evidence items in your system. Here are the key ones:\n\n1. **User Access Review Report** - Last updated 2 weeks ago\n2. **Privileged Access Policy** - Approved 1 month ago\n3. **Access Control Matrix** - Current version\n\nWould you like me to show you the details of any specific evidence item?',
        responseTime: 1200,
        contextSources: [
          {
            sourceType: 'EVIDENCE',
            sourceId: 'evidence-1',
            chunkText: 'User access review procedures and controls',
            similarity: 0.89,
          },
          {
            sourceType: 'POLICY',
            sourceId: 'policy-1',
            chunkText: 'Access control policy and procedures',
            similarity: 0.85,
          },
        ],
        modelUsed: 'gpt-4',
        tokenCount: 150,
        status: 'COMPLETED',
        confidenceScore: 0.87,
      },
      {
        organizationId: organization.id,
        userId: user.id,
        sessionId: createdSessions[0].id,
        queryText: 'Which controls lack current evidence?',
        responseText: 'I identified 3 controls that lack current evidence:\n\n1. **CC6.1** - Logical Access Controls (Evidence expired 2 weeks ago)\n2. **CC6.2** - Access Restriction Management (No evidence uploaded)\n3. **CC6.3** - Remote Access Controls (Evidence outdated)\n\nI recommend prioritizing CC6.1 as it\'s critical for SOC 2 compliance.',
        responseTime: 1800,
        contextSources: [
          {
            sourceType: 'CONTROL',
            sourceId: 'control-1',
            chunkText: 'Logical access control requirements',
            similarity: 0.92,
          },
        ],
        modelUsed: 'gpt-4',
        tokenCount: 200,
        status: 'COMPLETED',
        confidenceScore: 0.91,
      },
      {
        organizationId: organization.id,
        userId: user.id,
        sessionId: createdSessions[1].id,
        queryText: 'Analyze our information security policy',
        responseText: 'Your Information Security Policy covers the essential areas:\n\n✅ **Data Classification** - Well defined\n✅ **Access Controls** - Comprehensive\n✅ **Incident Response** - Clear procedures\n⚠️ **Remote Work** - Needs updating for current practices\n\nRecommendation: Update the remote work section to reflect current hybrid work policies.',
        responseTime: 2100,
        contextSources: [
          {
            sourceType: 'POLICY',
            sourceId: 'policy-2',
            chunkText: 'Information security policy and procedures',
            similarity: 0.88,
          },
        ],
        modelUsed: 'gpt-4',
        tokenCount: 180,
        status: 'COMPLETED',
        confidenceScore: 0.84,
      },
    ];

    const createdQueries = [];
    for (const queryData of queries) {
      const query = await prisma.aIQuery.create({
        data: queryData,
      });
      createdQueries.push(query);
    }

    console.log('   Creating AI feedback...');
    
    // Create sample feedback
    const feedback = [
      {
        aiQueryId: createdQueries[0].id,
        userId: user.id,
        rating: 5,
        comment: 'Very helpful and accurate!',
        feedbackType: 'HELPFUL',
      },
      {
        aiQueryId: createdQueries[1].id,
        userId: user.id,
        rating: 4,
        comment: 'Good analysis, but could be more specific about remediation steps.',
        feedbackType: 'HELPFUL',
        improvementSuggestion: 'Include specific action items for each gap identified',
      },
      {
        aiQueryId: createdQueries[2].id,
        userId: user.id,
        rating: 5,
        comment: 'Excellent policy analysis with clear recommendations.',
        feedbackType: 'ACCURATE',
      },
    ];

    for (const feedbackData of feedback) {
      await prisma.aIFeedback.create({
        data: feedbackData,
      });
    }

    console.log('   Creating sample embeddings...');
    
    // Create sample embeddings (simplified - in production these would be real vectors)
    const embeddings = [
      {
        organizationId: organization.id,
        sourceType: 'EVIDENCE',
        sourceId: 'evidence-1',
        vector: Array(1536).fill(0).map(() => Math.random() - 0.5), // Mock embedding vector
        embeddingModel: 'text-embedding-ada-002',
        chunkText: 'User access review procedures and controls for privileged accounts',
        metadata: {
          title: 'User Access Review Report',
          type: 'DOCUMENT',
          status: 'APPROVED',
        },
      },
      {
        organizationId: organization.id,
        sourceType: 'POLICY',
        sourceId: 'policy-1',
        vector: Array(1536).fill(0).map(() => Math.random() - 0.5), // Mock embedding vector
        embeddingModel: 'text-embedding-ada-002',
        chunkText: 'Access control policy and procedures for system access management',
        metadata: {
          title: 'Access Control Policy',
          category: 'TECHNICAL',
          status: 'PUBLISHED',
        },
      },
      {
        organizationId: organization.id,
        sourceType: 'CONTROL',
        sourceId: 'control-1',
        vector: Array(1536).fill(0).map(() => Math.random() - 0.5), // Mock embedding vector
        embeddingModel: 'text-embedding-ada-002',
        chunkText: 'Logical access control requirements and implementation guidelines',
        metadata: {
          name: 'Logical Access Controls',
          category: 'TECHNOLOGY',
          status: 'MET',
        },
      },
    ];

    for (const embeddingData of embeddings) {
      await prisma.aIEmbedding.create({
        data: embeddingData,
      });
    }

    console.log('✅ AI Assistance Layer data population completed successfully!');
    console.log(`   📊 Created:`);
    console.log(`      - ${models.length} AI models`);
    console.log(`      - ${sessions.length} AI sessions`);
    console.log(`      - ${queries.length} AI queries`);
    console.log(`      - ${feedback.length} feedback entries`);
    console.log(`      - ${embeddings.length} embeddings`);

  } catch (error) {
    console.error('❌ Error populating AI data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the population script
populateAIData()
  .then(() => {
    console.log('🎉 AI data population completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 AI data population failed:', error);
    process.exit(1);
  });
