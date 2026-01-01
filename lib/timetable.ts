import { prisma } from './prisma';

export async function getClassTimetable(programName: string, semester: string, dayOfWeek?: string) {
  const where: any = {
    programName,
    semester,
  };
  if (dayOfWeek) where.dayOfWeek = dayOfWeek;
  const rows = await prisma.classTimetable.findMany({ where, orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }] });
  return rows;
}

export async function getExamTimetable(programName: string, semester: string, examName?: string) {
  const where: any = { programName, semester };
  if (examName) where.examName = examName;
  const rows = await prisma.examTimetable.findMany({ where, orderBy: [{ examDate: 'asc' }] });
  return rows;
}
