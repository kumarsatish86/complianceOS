const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('🔐 Creating platform admin account...')
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        platformRole: 'SUPER_ADMIN'
      }
    })

    if (existingAdmin) {
      console.log('⚠️  Super admin already exists!')
      console.log(`   Email: ${existingAdmin.email}`)
      return
    }

    // Create admin user
    const adminEmail = 'admin@complianceos.com'
    const adminPassword = 'Admin123!@#'
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    const adminUser = await prisma.user.create({
      data: {
        name: 'Platform Administrator',
        email: adminEmail,
        password: hashedPassword,
        platformRole: 'SUPER_ADMIN',
        emailVerified: new Date(),
      }
    })

    console.log('✅ Platform admin account created successfully!')
    console.log('')
    console.log('📧 Login Credentials:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
    console.log('')
    console.log('🔗 Access the platform at: http://localhost:3000')
    console.log('')
    console.log('⚠️  IMPORTANT: Change the password after first login!')

  } catch (error) {
    console.error('❌ Error creating admin account:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
