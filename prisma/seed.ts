import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL || '';
console.log('Database URL:', databaseUrl ? databaseUrl.substring(0, 50) + '...' : 'Not set');

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('chat@2025', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'chatbot.prc2025@gmail.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'chatbot.prc2025@gmail.com',
      passwordHash: hashedPassword,
      role: 'admin',
    },
  });

  console.log('Created admin user:', admin.email);

  // Create sample staff
  const staff = await prisma.staff.createMany({
    data: [
      {
        name: 'Dr. John Smith',
        department: 'Computer Science',
        designation: 'Head of Department',
        email: 'john.smith@pce.edu',
        phone: '+91 9876543210',
        status: 'ACTIVE',
      },
      {
        name: 'Dr. Sarah Johnson',
        department: 'Mechanical Engineering',
        designation: 'Professor',
        email: 'sarah.johnson@pce.edu',
        phone: '+91 9876543211',
        status: 'ACTIVE',
      },
      {
        name: 'Dr. Michael Brown',
        department: 'Electrical Engineering',
        designation: 'Head of Department',
        email: 'michael.brown@pce.edu',
        status: 'ACTIVE',
      },
    ],
  });

  console.log('Created staff members:', staff.count);

  // Create sample fees
  const fees = await prisma.fee.createMany({
    data: [
      {
        programName: 'B.Tech Computer Science',
        academicYear: '2024-2025',
        yearOrSemester: 'Year 1',
        category: 'Tuition',
        amount: 50000,
        currency: 'INR',
      },
      {
        programName: 'B.Tech Computer Science',
        academicYear: '2024-2025',
        yearOrSemester: 'Year 1',
        category: 'Library',
        amount: 5000,
        currency: 'INR',
      },
      {
        programName: 'B.Tech Computer Science',
        academicYear: '2024-2025',
        yearOrSemester: 'Year 2',
        category: 'Tuition',
        amount: 55000,
        currency: 'INR',
      },
      {
        programName: 'B.Tech Mechanical Engineering',
        academicYear: '2024-2025',
        yearOrSemester: 'Year 1',
        category: 'Tuition',
        amount: 48000,
        currency: 'INR',
      },
    ],
  });

  console.log('Created fee entries:', fees.count);

  // Create sample rooms
  const rooms = await prisma.room.createMany({
    data: [
      {
        roomCode: 'CS-101',
        buildingName: 'Main Block',
        floor: '1st Floor',
        textDirections: 'Near the main entrance, first room on the left',
        latitude: 12.9716,
        longitude: 77.5946,
      },
      {
        roomCode: 'CS-201',
        buildingName: 'Main Block',
        floor: '2nd Floor',
        textDirections: 'Second floor, opposite to the staircase',
        latitude: 12.9716,
        longitude: 77.5946,
      },
      {
        roomCode: 'ME-301',
        buildingName: 'Engineering Block',
        floor: '3rd Floor',
        textDirections: 'Third floor, near the lab',
        latitude: 12.9720,
        longitude: 77.5950,
      },
      {
        roomCode: 'LIB-001',
        buildingName: 'Library Building',
        floor: 'Ground Floor',
        textDirections: 'Main library hall, near the reading area',
        latitude: 12.9710,
        longitude: 77.5940,
      },
    ],
  });

  console.log('Created rooms:', rooms.count);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

