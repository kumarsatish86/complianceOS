const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrganizations() {
  try {
    console.log('Checking existing organizations...');
    
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
    });

    console.log('Found organizations:', organizations);

    if (organizations.length === 0) {
      console.log('No organizations found. Creating default organization...');
      
      const defaultOrg = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default-org',
          status: 'active',
          plan: 'free',
          description: 'Default organization for complianceOS',
        },
      });

      console.log('Created default organization:', defaultOrg);
      return defaultOrg.id;
    } else {
      console.log('Using existing organization:', organizations[0].id);
      return organizations[0].id;
    }

  } catch (error) {
    console.error('Error checking organizations:', error);
    throw error;
  }
}

// Run the check
checkOrganizations()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
