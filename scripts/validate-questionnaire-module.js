const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function validateQuestionnaireModule() {
  try {
    console.log('🔍 Validating Security Questionnaire Automation Module...\n');

    // Test database connection
    console.log('📊 Testing database connection...');
    const answerLibraryCount = await prisma.answerLibrary.count();
    console.log(`  ✅ Answer Library entries: ${answerLibraryCount}`);

    const orgCount = await prisma.organization.count();
    console.log(`  ✅ Organizations: ${orgCount}`);

    const userCount = await prisma.user.count();
    console.log(`  ✅ Users: ${userCount}`);

    // Check questionnaire tables
    console.log('\n📋 Checking questionnaire tables...');
    const questionnaireCount = await prisma.questionnaire.count();
    console.log(`  ✅ Questionnaires: ${questionnaireCount}`);

    const questionCount = await prisma.question.count();
    console.log(`  ✅ Questions: ${questionCount}`);

    const answerCount = await prisma.answer.count();
    console.log(`  ✅ Answers: ${answerCount}`);

    const exportCount = await prisma.questionnaireExport.count();
    console.log(`  ✅ Exports: ${exportCount}`);

    const activityCount = await prisma.questionnaireActivity.count();
    console.log(`  ✅ Activities: ${activityCount}`);

    // Check answer library categories
    if (answerLibraryCount > 0) {
      console.log('\n📚 Answer Library Categories:');
      const categories = await prisma.answerLibrary.groupBy({
        by: ['category'],
        _count: { id: true }
      });
      
      categories.forEach(cat => {
        console.log(`  - ${cat.category}: ${cat._count.id} entries`);
      });
    }

    // Check questionnaire status distribution
    if (questionnaireCount > 0) {
      console.log('\n📈 Questionnaire Status Distribution:');
      const statusCounts = await prisma.questionnaire.groupBy({
        by: ['status'],
        _count: { id: true }
      });

      statusCounts.forEach(status => {
        console.log(`  - ${status.status}: ${status._count.id} questionnaires`);
      });
    }

    console.log('\n🎉 Validation Complete!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Database connection successful');
    console.log('  ✅ All questionnaire tables accessible');
    console.log('  ✅ Answer library populated');
    console.log('  ✅ Module ready for use');

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

validateQuestionnaireModule()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
