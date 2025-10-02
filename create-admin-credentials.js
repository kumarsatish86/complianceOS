#!/usr/bin/env node

/**
 * Sample Admin User Credentials Generator
 * 
 * This script creates a sample admin user for the ComplianceOS platform.
 * Run this script to generate admin credentials for testing and development.
 */

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminCredentials() {
  try {
    console.log('🚀 ComplianceOS - Sample Admin Credentials Generator')
    console.log('=' .repeat(50))
    
    // Check if SUPER_ADMIN platform role exists
    let superAdminRole = await prisma.platformRole.findUnique({
      where: { name: 'SUPER_ADMIN' }
    })
    
    if (!superAdminRole) {
      console.log('📝 Creating SUPER_ADMIN platform role...')
      superAdminRole = await prisma.platformRole.create({
        data: {
          name: 'SUPER_ADMIN',
          description: 'Super Administrator with full platform access',
          permissions: [
            'PLATFORM_ADMIN',
            'ORGANIZATION_MANAGE',
            'USER_MANAGE',
            'SYSTEM_CONFIG',
            'AUDIT_MANAGE',
            'COMPLIANCE_MANAGE',
            'REPORT_GENERATE',
            'DATA_EXPORT',
            'INTEGRATION_MANAGE',
            'POLICY_MANAGE',
            'RISK_MANAGE',
            'EVIDENCE_MANAGE',
            'QUESTIONNAIRE_MANAGE',
            'KNOWLEDGE_MANAGE',
            'AI_MANAGE'
          ],
          isSystem: true,
          isActive: true
        }
      })
      console.log('✅ SUPER_ADMIN role created')
    }
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        platformRoleId: superAdminRole.id
      }
    })
    
    if (existingAdmin) {
      console.log('')
      console.log('⚠️  Super admin already exists!')
      console.log('')
      console.log('📧 Existing Admin Credentials:')
      console.log(`   Email: ${existingAdmin.email}`)
      console.log(`   Name: ${existingAdmin.name}`)
      console.log(`   Role: ${superAdminRole.name}`)
      console.log('')
      console.log('🔗 Access the platform at: http://localhost:3000')
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
        platformRoleId: superAdminRole.id,
        emailVerified: new Date(),
      }
    })
    
    console.log('')
    console.log('✅ Sample admin user created successfully!')
    console.log('')
    console.log('📧 Login Credentials:')
    console.log('   ' + '='.repeat(30))
    console.log(`   Email:    ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
    console.log('   ' + '='.repeat(30))
    console.log('')
    console.log('🔗 Access the platform at: http://localhost:3000')
    console.log('')
    console.log('🎯 Admin User Details:')
    console.log(`   ID: ${adminUser.id}`)
    console.log(`   Name: ${adminUser.name}`)
    console.log(`   Role: ${superAdminRole.name}`)
    console.log(`   Permissions: ${superAdminRole.permissions.length} permissions granted`)
    console.log('')
    console.log('⚠️  IMPORTANT SECURITY NOTES:')
    console.log('   • Change the password after first login')
    console.log('   • These are sample credentials for development only')
    console.log('   • Do not use these credentials in production')
    console.log('')
    console.log('🎉 Ready to use ComplianceOS!')
    
  } catch (error) {
    console.error('')
    console.error('❌ Error creating admin user:', error.message)
    console.error('')
    console.error('🔧 Troubleshooting:')
    console.error('   • Make sure PostgreSQL database is running')
    console.error('   • Check DATABASE_URL in .env.local file')
    console.error('   • Run: npm run db:push (if database schema is not up to date)')
    console.error('')
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createAdminCredentials()
