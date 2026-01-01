import { prisma } from './prisma';

/**
 * Check if message is a simple greeting
 */
export function isGreeting(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  const greetingPatterns = [
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup|what's up|wassup)$/i,
    /^(hi|hello|hey)\s*[!.]*$/i,
    /^(hi|hello|hey)\s+(there|everyone|all)$/i,
  ];
  
  return greetingPatterns.some(pattern => pattern.test(lowerMessage));
}

/**
 * Intent detection - improved keyword-based classification
 */
export function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Check for greetings first
  if (isGreeting(message)) {
    return 'GREETING';
  }
  
  // Fees intent - expanded keywords
  if (lowerMessage.includes('fee') || lowerMessage.includes('tuition') || 
      lowerMessage.includes('payment') || lowerMessage.includes('cost') ||
      lowerMessage.includes('price') || lowerMessage.includes('charges')) {
    return 'FEES_INFO';
  }
  
  // Staff/Faculty intent - expanded keywords and department abbreviations
  if (lowerMessage.includes('teacher') || lowerMessage.includes('professor') || 
      lowerMessage.includes('hod') || lowerMessage.includes('faculty') || 
      lowerMessage.includes('staff') || lowerMessage.includes('head') ||
      lowerMessage.includes('faculties') || lowerMessage.includes('facult') ||
      lowerMessage.includes('cse') || lowerMessage.includes('computer science') ||
      lowerMessage.includes('me') || lowerMessage.includes('mechanical') ||
      lowerMessage.includes('ee') || lowerMessage.includes('electrical') ||
      lowerMessage.includes('department') || lowerMessage.includes('dept')) {
    return 'STAFF_INFO';
  }
  
  // Directions intent
  if (lowerMessage.includes('where') || lowerMessage.includes('location') || 
      lowerMessage.includes('room') || lowerMessage.includes('building') || 
      lowerMessage.includes('directions') || lowerMessage.includes('find') ||
      lowerMessage.includes('how to reach') || lowerMessage.includes('how to get')) {
    return 'DIRECTIONS';
  }
  
  // Events intent
  if (lowerMessage.includes('event') || lowerMessage.includes('announcement') || 
      lowerMessage.includes('news') || lowerMessage.includes('upcoming')) {
    return 'EVENTS_INFO';
  }
  
  // Admission intent
  if (lowerMessage.includes('admission') || lowerMessage.includes('admit') ||
      lowerMessage.includes('enroll') || lowerMessage.includes('enrollment') ||
      lowerMessage.includes('apply') || lowerMessage.includes('application')) {
    return 'ADMISSION_INFO';
  }
  
  // Timetable intent
  if (lowerMessage.includes('timetable') || lowerMessage.includes('schedule') ||
      lowerMessage.includes('class time') || lowerMessage.includes('when is class') ||
      lowerMessage.includes('what time') || lowerMessage.includes('period')) {
    return 'TIMETABLE_INFO';
  }
  
  // Exam intent
  if (lowerMessage.includes('exam') || lowerMessage.includes('examination') ||
      lowerMessage.includes('test') || lowerMessage.includes('when is exam') ||
      lowerMessage.includes('exam date') || lowerMessage.includes('exam schedule')) {
    return 'EXAM_INFO';
  }
  
  return 'GENERAL_INFO';
}

/**
 * Query staff information from database with in-memory filtering (SQLite friendly)
 */
export async function getStaffInfo(query: string): Promise<any[]> {
  const queryLower = query.toLowerCase().trim();
  
  // Department abbreviation mapping
  const deptMap: { [key: string]: string[] } = {
    'cse': ['computer science', 'cs'],
    'cs': ['computer science', 'cse'],
    'me': ['mechanical', 'mechanical engineering'],
    'ee': ['electrical', 'electrical engineering'],
    'ece': ['electronics', 'electronics and communication'],
  };
  
  // Expand department abbreviations
  const expandedTerms: string[] = [queryLower];
  for (const [abbr, fullNames] of Object.entries(deptMap)) {
    if (queryLower.includes(abbr)) {
      expandedTerms.push(...fullNames);
    }
  }
  
  // SQLite doesn't support case-insensitive mode, so fetch all active staff
  const allStaff = await prisma.staff.findMany({
    where: {
      status: 'ACTIVE',
    },
    take: 50, // Get more to filter
  });
  
  // If query is very generic (just asking about staff/faculty), return all staff
  if (queryLower.includes('facult') || queryLower.includes('staff') || queryLower.includes('teacher') || queryLower.includes('professor')) {
    if (queryLower.length < 20 || queryLower.includes('all')) {
      return allStaff.slice(0, 10);
    }
  }
  
  // Filter for case-insensitive matches with expanded terms - more lenient
  const filtered = allStaff.filter((staff) => {
    const nameLower = staff.name.toLowerCase();
    const deptLower = staff.department.toLowerCase();
    const desigLower = staff.designation.toLowerCase();
    const emailLower = (staff.email || '').toLowerCase();
    
    // Check if any expanded term matches - use original terms, not cleaned
    return expandedTerms.some(term => {
      if (!term || term.length < 2) return false;
      
      return nameLower.includes(term) || 
             deptLower.includes(term) || 
             desigLower.includes(term) ||
             emailLower.includes(term);
    });
  });
  
  // If no specific match, return all staff if query is generic
  if (filtered.length === 0 && (queryLower.includes('all') || queryLower.includes('facult') || queryLower.includes('staff'))) {
    return allStaff.slice(0, 10);
  }
  
  return filtered.length > 0 ? filtered.slice(0, 10) : [];
}

/**
 * Query fee information from database with in-memory case-insensitive filtering
 */
export async function getFeeInfo(query: string): Promise<any[]> {
  const queryLower = query.toLowerCase();
  
  // SQLite doesn't support case-insensitive mode, so fetch all fees
  // and filter in memory
  const allFees = await prisma.fee.findMany({
    take: 100, // Get more to filter for better accuracy
    orderBy: { academicYear: 'desc' }, // Most recent first
  });
  
  // If query is very generic (just asking about fees), return all fees
  if (queryLower.includes('fee') || queryLower.includes('payment') || queryLower.includes('tuition') || queryLower.includes('cost')) {
    if (queryLower.length < 25) {
      return allFees.slice(0, 20);
    }
  }
  
  // Filter for case-insensitive matches - use original query, not cleaned
  const filtered = allFees.filter((fee) => {
    const programLower = (fee.programName || '').toLowerCase();
    const yearLower = (fee.academicYear || '').toLowerCase();
    const categoryLower = (fee.category || '').toLowerCase();
    
    return programLower.includes(queryLower) || 
           yearLower.includes(queryLower) || 
           categoryLower.includes(queryLower);
  });
  
  // If no specific match but query mentions fees, return all
  if (filtered.length === 0 && (queryLower.includes('fee') || queryLower.includes('payment'))) {
    return allFees.slice(0, 20);
  }
  
  return filtered.length > 0 ? filtered.slice(0, 20) : [];
}

/**
 * Query room/location information from database with in-memory filtering
 * Returns the most relevant room or null
 */
export async function getRoomDirections(query: string): Promise<any | null> {
  const queryLower = query.toLowerCase();
  
  // Clean query - remove common words
  const cleanQuery = queryLower.replace(/\b(all|the|tell|me|about|show|find|where|is|location|locations|room|rooms|building|buildings)\b/g, '').trim();
  
  // SQLite doesn't support case-insensitive mode, so fetch all rooms
  // and filter in memory
  const allRooms = await prisma.room.findMany({
    take: 100, // Get more to filter for better accuracy
  });
  
  // If query is too generic, return null (let user be more specific)
  if (!cleanQuery || cleanQuery.length < 2) {
    return null;
  }
  
  // Try to find by room code first (exact match preferred)
  const roomByCode = allRooms.find((room) => 
    room.roomCode.toLowerCase().includes(cleanQuery)
  );
  
  if (roomByCode) return roomByCode;
  
  // Then try building name
  const roomByBuilding = allRooms.find((room) => 
    room.buildingName.toLowerCase().includes(cleanQuery)
  );
  
  if (roomByBuilding) return roomByBuilding;
  
  // Try floor if query matches
  const roomByFloor = allRooms.find((room) => 
    room.floor.toLowerCase().includes(cleanQuery)
  );
  
  return roomByFloor || null;
}

/**
 * Query class timetable information from database
 */
export async function getClassTimetable(query: string): Promise<any[]> {
  const queryLower = query.toLowerCase();
  
  // Fetch all class timetables
  const allTimetables = await prisma.classTimetable.findMany({
    take: 100,
  });
  
  // Filter based on query terms
  const filtered = allTimetables.filter((tt) => {
    const programLower = (tt.programName || '').toLowerCase();
    const semesterLower = (tt.semester || '').toLowerCase();
    const subjectLower = (tt.subject || '').toLowerCase();
    const dayLower = (tt.dayOfWeek || '').toLowerCase();
    const facultyLower = (tt.faculty || '').toLowerCase();
    const roomLower = (tt.room || '').toLowerCase();
    
    // Clean query - remove common words
    const cleanQuery = queryLower.replace(/\b(all|the|tell|me|about|show|list|timetable|schedule|class)\b/g, '').trim();
    
    return programLower.includes(cleanQuery) ||
           semesterLower.includes(cleanQuery) ||
           subjectLower.includes(cleanQuery) ||
           dayLower.includes(cleanQuery) ||
           facultyLower.includes(cleanQuery) ||
           roomLower.includes(cleanQuery) ||
           (cleanQuery.length < 3 && queryLower.includes('timetable')); // Generic timetable query
  });
  
  return filtered.slice(0, 20);
}

/**
 * Query exam timetable information from database
 */
export async function getExamTimetable(query: string): Promise<any[]> {
  const queryLower = query.toLowerCase();
  
  // Fetch all exam timetables
  const allExams = await prisma.examTimetable.findMany({
    take: 100,
    orderBy: { examDate: 'asc' },
  });
  
  // Filter based on query terms
  const filtered = allExams.filter((exam) => {
    const programLower = (exam.programName || '').toLowerCase();
    const semesterLower = (exam.semester || '').toLowerCase();
    const examNameLower = (exam.examName || '').toLowerCase();
    const subjectLower = (exam.subject || '').toLowerCase();
    const roomLower = (exam.room || '').toLowerCase();
    
    // Clean query - remove common words
    const cleanQuery = queryLower.replace(/\b(all|the|tell|me|about|show|list|exam|examination|timetable|schedule)\b/g, '').trim();
    
    return programLower.includes(cleanQuery) ||
           semesterLower.includes(cleanQuery) ||
           examNameLower.includes(cleanQuery) ||
           subjectLower.includes(cleanQuery) ||
           roomLower.includes(cleanQuery) ||
           (cleanQuery.length < 3 && (queryLower.includes('exam') || queryLower.includes('timetable')));
  });
  
  return filtered.slice(0, 20);
}

/**
 * Query contact information from database with in-memory filtering
 */
export async function getContactInfo(query: string): Promise<any[]> {
  const queryLower = query.toLowerCase();
  
  // Fetch all contacts
  const allContacts = await prisma.contact.findMany({
    take: 50,
    orderBy: { priority: 'desc' },
  });
  
  // If query is very generic or mentions contacts, return all
  if (queryLower.includes('contact') && queryLower.length < 15) {
    return allContacts.slice(0, 10);
  }
  
  // Filter for case-insensitive matches - use original query, not cleaned
  const filtered = allContacts.filter((contact) => {
    const nameLower = (contact.name || '').toLowerCase();
    const deptLower = (contact.department || '').toLowerCase();
    const desigLower = (contact.designation || '').toLowerCase();
    const emailLower = (contact.email || '').toLowerCase();
    const phoneLower = (contact.phone || '').toLowerCase();
    const categoryLower = (contact.category || '').toLowerCase();
    
    // Use original query for matching - more lenient
    return nameLower.includes(queryLower) ||
           deptLower.includes(queryLower) ||
           desigLower.includes(queryLower) ||
           emailLower.includes(queryLower) ||
           phoneLower.includes(queryLower) ||
           categoryLower.includes(queryLower);
  });
  
  return filtered.slice(0, 10);
}

/**
 * Query academic PDF information from database with in-memory filtering
 */
export async function getAcademicPdfInfo(query: string): Promise<any[]> {
  const queryLower = query.toLowerCase();
  
  // Fetch all academic PDFs
  const allPdfs = await prisma.academicPdf.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
  });
  
  // If query is very generic, return recent PDFs
  if (queryLower.includes('pdf') || queryLower.includes('academic') || queryLower.includes('document')) {
    if (queryLower.length < 15) {
      return allPdfs.slice(0, 10);
    }
  }
  
  // Filter for case-insensitive matches - use original query
  const filtered = allPdfs.filter((pdf) => {
    const titleLower = (pdf.title || '').toLowerCase();
    const descLower = (pdf.description || '').toLowerCase();
    const semesterLower = (pdf.semester || '').toLowerCase();
    const subjectLower = (pdf.subject || '').toLowerCase();
    const categoryLower = (pdf.category || '').toLowerCase();
    
    // Use original query for matching - more lenient
    return titleLower.includes(queryLower) ||
           descLower.includes(queryLower) ||
           semesterLower.includes(queryLower) ||
           subjectLower.includes(queryLower) ||
           categoryLower.includes(queryLower);
  });
  
  return filtered.slice(0, 10);
}

