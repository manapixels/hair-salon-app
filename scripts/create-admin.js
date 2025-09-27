#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@luxecuts.com' },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists: admin@luxecuts.com');
      console.log('Password: admin123');
      return;
    }

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@luxecuts.com',
        password: 'admin123', // In production, hash this
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@luxecuts.com');
    console.log('🔑 Password: admin123');
    console.log('');
    console.log('⚠️  Remember to change the password in production!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
