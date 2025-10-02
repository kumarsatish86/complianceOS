const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupPlatform() {
  try {
    console.log('🚀 Setting up complianceOS platform...')
    console.log('')

    // Create platform admin users
    const platformUsers = [
      {
        name: 'Platform Administrator',
        email: 'admin@complianceos.com',
        password: 'Admin123!@#',
        platformRole: 'SUPER_ADMIN'
      },
      {
        name: 'Platform Manager',
        email: 'manager@complianceos.com',
        password: 'Manager123!@#',
        platformRole: 'PLATFORM_ADMIN'
      },
      {
        name: 'Platform Developer',
        email: 'developer@complianceos.com',
        password: 'Developer123!@#',
        platformRole: 'PLATFORM_DEVELOPER'
      },
      {
        name: 'Platform Support',
        email: 'support@complianceos.com',
        password: 'Support123!@#',
        platformRole: 'PLATFORM_SUPPORT'
      }
    ]

    console.log('👥 Creating platform users...')
    
    for (const userData of platformUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (existingUser) {
        console.log(`   ⚠️  User ${userData.email} already exists`)
        continue
      }

      // Create user
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      
      await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          platformRole: userData.platformRole,
          emailVerified: new Date(),
        }
      })

      console.log(`   ✅ Created ${userData.platformRole}: ${userData.email}`)
    }

    console.log('')
    console.log('🎉 Platform setup completed successfully!')
    console.log('')
    console.log('📧 Platform Access Credentials:')
    console.log('')
    console.log('🔑 SUPER ADMIN (Full Platform Access):')
    console.log('   Email: admin@complianceos.com')
    console.log('   Password: Admin123!@#')
    console.log('')
    console.log('🔑 PLATFORM ADMIN (Platform Management):')
    console.log('   Email: manager@complianceos.com')
    console.log('   Password: Manager123!@#')
    console.log('')
    console.log('🔑 PLATFORM DEVELOPER (Development Access):')
    console.log('   Email: developer@complianceos.com')
    console.log('   Password: Developer123!@#')
    console.log('')
    console.log('🔑 PLATFORM SUPPORT (Support Access):')
    console.log('   Email: support@complianceos.com')
    console.log('   Password: Support123!@#')
    console.log('')
    console.log('🔗 Access the platform at: http://localhost:3000')
    console.log('')
    console.log('⚠️  IMPORTANT: Change all passwords after first login!')
    console.log('')

  } catch (error) {
    console.error('❌ Error setting up platform:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupPlatform()
