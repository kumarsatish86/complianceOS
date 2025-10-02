const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Set environment variable for database connection
process.env.DATABASE_URL = 'postgresql://postgres:Admin1234@localhost:5432/cos?schema=public'

const prisma = new PrismaClient()

async function setupDatabase() {
  try {
    console.log('🔌 Testing database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully!')
    
    // Check if admin user exists
    let admin = await prisma.user.findFirst({
      where: { email: 'admin@complianceos.com' }
    })
    
    if (!admin) {
      console.log('👤 Creating admin user...')
      
      const hashedPassword = await bcrypt.hash('Admin123!@#', 12)
      
      admin = await prisma.user.create({
        data: {
          name: 'Platform Administrator',
          email: 'admin@complianceos.com',
          password: hashedPassword,
          platformRole: 'SUPER_ADMIN',
          emailVerified: new Date(),
        }
      })
      
      console.log('✅ Admin user created!')
    } else {
      console.log('✅ Admin user already exists!')
    }
    
    console.log('📧 Email:', admin.email)
    console.log('👤 Role:', admin.platformRole)
    console.log('🔑 Has password:', !!admin.password)
    
    // Test password verification
    if (admin.password) {
      const isValid = await bcrypt.compare('Admin123!@#', admin.password)
      console.log('🔐 Password test:', isValid ? '✅ Valid' : '❌ Invalid')
    }
    
    console.log('\n🎉 Database setup completed!')
    console.log('📧 Login credentials:')
    console.log('   Email: admin@complianceos.com')
    console.log('   Password: Admin123!@#')
    
  } catch (error) {
    console.error('❌ Database error:', error.message)
    
    if (error.message.includes('connect')) {
      console.log('\n💡 Database connection failed. Please ensure:')
      console.log('   1. PostgreSQL is running on localhost:5432')
      console.log('   2. Database "cos" exists')
      console.log('   3. User "postgres" has password "Admin1234"')
      console.log('   4. Or update the DATABASE_URL in this script')
    }
  } finally {
    await prisma.$disconnect()
  }
}

setupDatabase()
