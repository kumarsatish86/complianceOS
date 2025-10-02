const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function createAdmin() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Creating admin user...')
    
    const adminEmail = 'admin@complianceos.com'
    const adminPassword = 'Admin123!@#'
    
    // Check if admin exists
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (existing) {
      console.log('Admin already exists:', adminEmail)
      return
    }
    
    // Create admin
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    const admin = await prisma.user.create({
      data: {
        name: 'Platform Administrator',
        email: adminEmail,
        password: hashedPassword,
        platformRole: 'SUPER_ADMIN',
        emailVerified: new Date(),
      }
    })
    
    console.log('✅ Admin created successfully!')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
