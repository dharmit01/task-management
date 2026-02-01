/**
 * Seed script to create an initial admin user
 * Run with: npm run seed
 */

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

// Import User model
import User from '../models/User.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function seedAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@taskmanager.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('   Email: admin@taskmanager.com');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await User.create({
      name: 'Admin User',
      email: 'admin@taskmanager.com',
      password: hashedPassword,
      role: 'Admin',
      isActive: true,
      annualLeaveBalance: 25
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📧 Login credentials:');
    console.log('   Email: admin@taskmanager.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedAdmin();
