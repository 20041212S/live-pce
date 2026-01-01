/**
 * Script to fix duplicate emails before adding unique constraint
 * Run this before: npm run db:push
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDuplicateEmails() {
  try {
    console.log('🔍 Checking for duplicate emails...');

    // Find duplicate emails
    const duplicates = await prisma.$queryRaw<Array<{ email: string; count: bigint }>>`
      SELECT email, COUNT(*) as count
      FROM client_users
      GROUP BY email
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length === 0) {
      console.log('✅ No duplicate emails found. Safe to run db:push');
      return;
    }

    console.log(`⚠️  Found ${duplicates.length} duplicate email(s):`);
    duplicates.forEach((dup) => {
      console.log(`   - ${dup.email} (${dup.count} records)`);
    });

    console.log('\n📝 Options:');
    console.log('1. Delete duplicate records (keeps the oldest one)');
    console.log('2. Reset entire database (WARNING: Deletes all data)');
    console.log('3. Exit and fix manually');

    // For now, just log the duplicates
    // User should manually fix or reset database
    console.log('\n⚠️  Please fix duplicates manually or reset database:');
    console.log('   rm prisma/dev.db && npm run db:push');

    process.exit(1);
  } catch (error: any) {
    console.error('❌ Error checking duplicates:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicateEmails();

