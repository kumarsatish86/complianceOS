const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifySetup() {
  try {
    console.log('🔍 Verifying platform setup...')
    console.log('')

    // Check platform users
    const platformUsers = await prisma.user.findMany({
      where: {
        platformRole: {
          in: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'PLATFORM_DEVELOPER', 'PLATFORM_SUPPORT']
        }
      },
      select: {
        name: true,
        email: true,
        platformRole: true,
        createdAt: true
      }
    })

    if (platformUsers.length === 0) {
      console.log('❌ No platform users found!')
      console.log('   Run: npm run setup')
      return
    }

    console.log('✅ Platform users found:')
    console.log('')
    
    platformUsers.forEach(user => {
      console.log(`   ${user.platformRole}: ${user.email}`)
    })

    console.log('')
    console.log('🔗 Access the platform at: http://localhost:3000')
    console.log('')
    console.log('📧 Default credentials:')
    console.log('   Super Admin: admin@complianceos.com / Admin123!@#')
    console.log('   Platform Admin: manager@complianceos.com / Manager123!@#')
    console.log('   Platform Developer: developer@complianceos.com / Developer123!@#')
    console.log('   Platform Support: support@complianceos.com / Support123!@#')

  } catch (error) {
    console.error('❌ Error verifying setup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifySetup()
