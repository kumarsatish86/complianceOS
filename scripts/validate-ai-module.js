const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function validateAIModule() {
  console.log('🤖 Validating AI Assistance Layer Module...');

  try {
    // Test database connection
    console.log('\n🔌 Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connection successful');

    // Test AI models
    console.log('\n🧠 Testing AI models...');
    const modelCount = await prisma.aIModel.count();
    console.log(`   ✅ AI models: ${modelCount} found`);

    if (modelCount > 0) {
      const models = await prisma.aIModel.findMany({
        take: 3,
        select: {
          modelName: true,
          modelVersion: true,
          provider: true,
          capabilities: true,
          activeFlag: true,
        },
      });
      console.log('   📋 Sample models:');
      models.forEach(model => {
        console.log(`      - ${model.modelName} v${model.modelVersion} (${model.provider})`);
        console.log(`        Capabilities: ${model.capabilities.join(', ')}`);
        console.log(`        Active: ${model.activeFlag}`);
      });
    }

    // Test AI sessions
    console.log('\n💬 Testing AI sessions...');
    const sessionCount = await prisma.aISession.count();
    console.log(`   ✅ AI sessions: ${sessionCount} found`);

    if (sessionCount > 0) {
      const sessions = await prisma.aISession.findMany({
        take: 3,
        include: {
          queries: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      console.log('   📋 Sample sessions:');
      sessions.forEach(session => {
        console.log(`      - "${session.sessionTitle}" (${session.queryCount} queries)`);
        console.log(`        Started: ${session.startedAt.toISOString()}`);
        console.log(`        Last activity: ${session.lastActivity.toISOString()}`);
      });
    }

    // Test AI queries
    console.log('\n❓ Testing AI queries...');
    const queryCount = await prisma.aIQuery.count();
    console.log(`   ✅ AI queries: ${queryCount} found`);

    if (queryCount > 0) {
      const queries = await prisma.aIQuery.findMany({
        take: 3,
        select: {
          queryText: true,
          responseText: true,
          status: true,
          confidenceScore: true,
          responseTime: true,
          tokenCount: true,
        },
      });
      console.log('   📋 Sample queries:');
      queries.forEach(query => {
        console.log(`      - Query: "${query.queryText.substring(0, 50)}..."`);
        console.log(`        Status: ${query.status}`);
        console.log(`        Confidence: ${query.confidenceScore ? (query.confidenceScore * 100).toFixed(1) + '%' : 'N/A'}`);
        console.log(`        Response time: ${query.responseTime}ms`);
        console.log(`        Tokens: ${query.tokenCount}`);
      });
    }

    // Test AI feedback
    console.log('\n👍 Testing AI feedback...');
    const feedbackCount = await prisma.aIFeedback.count();
    console.log(`   ✅ AI feedback: ${feedbackCount} found`);

    if (feedbackCount > 0) {
      const feedback = await prisma.aIFeedback.groupBy({
        by: ['feedbackType'],
        _count: true,
      });
      console.log('   📋 Feedback distribution:');
      feedback.forEach(fb => {
        console.log(`      - ${fb.feedbackType}: ${fb._count} entries`);
      });
    }

    // Test AI embeddings
    console.log('\n🔍 Testing AI embeddings...');
    const embeddingCount = await prisma.aIEmbedding.count();
    console.log(`   ✅ AI embeddings: ${embeddingCount} found`);

    if (embeddingCount > 0) {
      const embeddings = await prisma.aIEmbedding.groupBy({
        by: ['sourceType'],
        _count: true,
      });
      console.log('   📋 Embedding distribution:');
      embeddings.forEach(emb => {
        console.log(`      - ${emb.sourceType}: ${emb._count} embeddings`);
      });
    }

    // Test relationships
    console.log('\n🔗 Testing relationships...');
    
    // Test AI query with session relationship
    const queryWithSession = await prisma.aIQuery.findFirst({
      include: {
        session: true,
        feedback: true,
      },
    });
    console.log(`   ✅ AI query relationships working: ${queryWithSession ? 'Yes' : 'No data'}`);

    // Test AI session with queries relationship
    const sessionWithQueries = await prisma.aISession.findFirst({
      include: {
        queries: {
          take: 1,
        },
      },
    });
    console.log(`   ✅ AI session relationships working: ${sessionWithQueries ? 'Yes' : 'No data'}`);

    // Test organization relationships
    const orgWithAI = await prisma.organization.findFirst({
      include: {
        aiQueries: {
          take: 1,
        },
        aiEmbeddings: {
          take: 1,
        },
        aiSessions: {
          take: 1,
        },
      },
    });
    console.log(`   ✅ Organization AI relationships working: ${orgWithAI ? 'Yes' : 'No data'}`);

    // Test user relationships
    const userWithAI = await prisma.user.findFirst({
      include: {
        aiQueries: {
          take: 1,
        },
        aiFeedback: {
          take: 1,
        },
        aiSessions: {
          take: 1,
        },
      },
    });
    console.log(`   ✅ User AI relationships working: ${userWithAI ? 'Yes' : 'No data'}`);

    // Test analytics queries
    console.log('\n📊 Testing analytics queries...');
    
    const analytics = await prisma.aIQuery.aggregate({
      _count: true,
      _avg: {
        responseTime: true,
        confidenceScore: true,
        tokenCount: true,
      },
    });
    console.log(`   ✅ Analytics queries working: Yes`);
    console.log(`      - Total queries: ${analytics._count}`);
    console.log(`      - Avg response time: ${analytics._avg.responseTime ? analytics._avg.responseTime.toFixed(0) + 'ms' : 'N/A'}`);
    console.log(`      - Avg confidence: ${analytics._avg.confidenceScore ? (analytics._avg.confidenceScore * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`      - Avg tokens: ${analytics._avg.tokenCount ? analytics._avg.tokenCount.toFixed(0) : 'N/A'}`);

    // Test enum values
    console.log('\n🏷️ Testing enum values...');
    
    const queryStatuses = await prisma.aIQuery.groupBy({
      by: ['status'],
      _count: true,
    });
    console.log(`   ✅ Query statuses: ${queryStatuses.map(s => s.status).join(', ')}`);

    const feedbackTypes = await prisma.aIFeedback.groupBy({
      by: ['feedbackType'],
      _count: true,
    });
    console.log(`   ✅ Feedback types: ${feedbackTypes.map(f => f.feedbackType).join(', ')}`);

    const modelProviders = await prisma.aIModel.groupBy({
      by: ['provider'],
      _count: true,
    });
    console.log(`   ✅ Model providers: ${modelProviders.map(p => p.provider).join(', ')}`);

    // Test performance
    console.log('\n⚡ Testing performance...');
    
    const startTime = Date.now();
    await prisma.aIQuery.findMany({
      take: 10,
      include: {
        session: true,
        feedback: true,
      },
    });
    const queryTime = Date.now() - startTime;
    console.log(`   ✅ Complex query performance: ${queryTime}ms`);

    console.log('\n✅ AI Assistance Layer Module validation completed successfully!');
    console.log('\n📋 Module Summary:');
    console.log(`   - AI Models: ${modelCount}`);
    console.log(`   - AI Sessions: ${sessionCount}`);
    console.log(`   - AI Queries: ${queryCount}`);
    console.log(`   - AI Feedback: ${feedbackCount}`);
    console.log(`   - AI Embeddings: ${embeddingCount}`);

  } catch (error) {
    console.error('❌ AI module validation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the validation script
validateAIModule()
  .then(() => {
    console.log('\n🎉 AI Assistance Layer validation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 AI Assistance Layer validation failed:', error);
    process.exit(1);
  });
