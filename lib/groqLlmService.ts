import Groq from 'groq-sdk';
import { getLanguageInstruction } from './languageDetection';

export type LlmContext = {
  intent: string;
  userMessage: string;
  data?: any; // structured data from DB / knowledge search
  language?: string; // detected language code (en, ml, hi, ta, etc.)
};

const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  console.warn('GROQ_API_KEY is not set. LLM responses will not be available.');
}

const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

export async function callGroqLLM(
  ctx: LlmContext
): Promise<{ answer: string; sources?: any[] }> {
  const { intent, userMessage, data, language = 'en' } = ctx;
  
  // Get language instruction for LLM
  const languageInstruction = getLanguageInstruction(language);

  // ALL SOURCES HAVE EQUAL PRIORITY - Check all available data sources
  const hasKnowledge = data?.knowledge && Array.isArray(data.knowledge) && data.knowledge.length > 0;
  const hasStaff = data?.staff && Array.isArray(data.staff) && data.staff.length > 0;
  const hasFees = data?.fees && Array.isArray(data.fees) && data.fees.length > 0;
  const hasRoom = data?.room;
  const hasClassTimetable = data?.classTimetable && Array.isArray(data.classTimetable) && data.classTimetable.length > 0;
  const hasExamTimetable = data?.examTimetable && Array.isArray(data.examTimetable) && data.examTimetable.length > 0;
  const hasContacts = data?.contacts && Array.isArray(data.contacts) && data.contacts.length > 0;
  const hasAcademicPdfs = data?.academicPdfs && Array.isArray(data.academicPdfs) && data.academicPdfs.length > 0;

  // Format knowledge base entries - EQUAL PRIORITY with all other sources
  let knowledgeSection = '';
  if (hasKnowledge) {
    knowledgeSection = `
📚 KNOWLEDGE BASE CONTENT (EQUAL PRIORITY with all other sources):
${data.knowledge.map((k: any, idx: number) => `
Entry ${idx + 1}:
- Title: ${k.name || 'Untitled'}
- Type: ${k.type || 'General'}
- Source: ${k.source || 'Admin'}
- Content: ${k.text || ''}
${k.imageUrl ? `- Image Available: Yes (image will be displayed automatically - DO NOT include the URL in your response)` : ''}
${k.imageDescription ? `- Image Description: ${k.imageDescription}` : ''}
`).join('\n')}

CRITICAL: Use ALL information from knowledge base EXACTLY as provided. This includes names, titles, designations, image descriptions, and any other details. DO NOT modify, add, or remove any information. If a name in the knowledge base includes "Dr", "Mr", "Mrs", "Ms", or any other title, use it exactly. If it doesn't include a title, DO NOT add one.

IMAGES - CRITICAL RULES:
- Images are ONLY shown when they are HIGHLY RELEVANT to the user's question
- When an image is available and relevant, mention it naturally in your response
- Example: "Here's the information about [topic], and I've included an image that shows [description]."
- Use the image description to provide context about what the image contains
- The image will be displayed automatically to the user - you do NOT need to include the image URL or path
- DO NOT include image URLs, file paths, or image file names in your response (like "/uploads/knowledge/..." or ".jpg" files)
- DO NOT write "Here's the image of..." followed by a URL or path
- DO NOT mention images if they're not relevant to the question - only mention when the image actually helps answer the question
- Simply mention that an image is available and describe what it shows - the system will display it automatically
- If the image is not relevant to the question, don't mention it at all
`;
  }

  // Format other data - use exact data without modifications (EQUAL PRIORITY with knowledge base)
  let staffSection = '';
  if (hasStaff) {
    staffSection = `
👥 STAFF INFORMATION (EQUAL PRIORITY - USE EXACTLY AS PROVIDED - DO NOT ADD TITLES):
${data.staff.map((staff: any) => ({
  name: staff.name || 'Unknown', // Use name EXACTLY as stored - includes title if present
  department: staff.department || 'Not specified',
  designation: staff.designation || 'Not specified',
  email: staff.email || 'Not available',
  phone: staff.phone || 'Not available',
  avatarUrl: staff.avatarUrl || null,
})).map((s: any, idx: number) => `Staff ${idx + 1}: ${JSON.stringify(s, null, 2)}`).join('\n\n')}

CRITICAL: Use names EXACTLY as shown above. If a name includes "Dr", "Mr", "Mrs", "Ms", etc., use it. If it doesn't, DO NOT add any title. This source has EQUAL PRIORITY with knowledge base and other sources.
`;
  }

  let feesSection = '';
  if (hasFees) {
    feesSection = `
💰 FEE INFORMATION (EQUAL PRIORITY - USE EXACTLY AS PROVIDED):
${data.fees.map((fee: any) => ({
  program: fee.programName || 'Not specified',
  academicYear: fee.academicYear || 'Not specified',
  yearOrSemester: fee.yearOrSemester || 'Not specified',
  category: fee.category || 'Not specified',
  amount: typeof fee.amount === 'object' && fee.amount !== null ? fee.amount.toString() : (fee.amount || '0'),
  currency: fee.currency || 'INR',
})).map((fee: any, idx: number) => `Fee ${idx + 1}: ${JSON.stringify(fee, null, 2)}`).join('\n\n')}

CRITICAL: Use all fee information EXACTLY as shown, including amounts and currency. This source has EQUAL PRIORITY with knowledge base and other sources.
`;
  }

  let roomSection = '';
  if (hasRoom) {
    roomSection = `
📍 ROOM/LOCATION INFORMATION (EQUAL PRIORITY):
${JSON.stringify(data.room, null, 2)}

CRITICAL: Use all room information EXACTLY as shown. This source has EQUAL PRIORITY with knowledge base and other sources.
`;
  }

  let classTimetableSection = '';
  if (hasClassTimetable) {
    classTimetableSection = `
📅 CLASS TIMETABLE INFORMATION (EQUAL PRIORITY - USE EXACTLY AS PROVIDED):
${data.classTimetable.map((tt: any) => ({
  program: tt.programName || 'Not specified',
  semester: tt.semester || 'Not specified',
  day: tt.dayOfWeek || 'Not specified',
  period: tt.period || 'Not specified',
  subject: tt.subject || 'Not specified',
  faculty: tt.faculty || 'Not assigned', // Use faculty name EXACTLY as stored - includes title if present
  room: tt.room || 'Not assigned',
})).map((tt: any, idx: number) => `Class ${idx + 1}: ${JSON.stringify(tt, null, 2)}`).join('\n\n')}

CRITICAL: Use faculty names EXACTLY as shown. If a faculty name includes "Dr" or any title, use it. If it doesn't, DO NOT add any title. This source has EQUAL PRIORITY with knowledge base and other sources.
`;
  }

  let examTimetableSection = '';
  if (hasExamTimetable) {
    examTimetableSection = `
📝 EXAM TIMETABLE INFORMATION (EQUAL PRIORITY - USE EXACTLY AS PROVIDED):
${data.examTimetable.map((exam: any) => ({
  program: exam.programName || 'Not specified',
  semester: exam.semester || 'Not specified',
  examName: exam.examName || 'Not specified',
  subject: exam.subject || 'Not specified',
  date: new Date(exam.examDate).toLocaleDateString(),
  time: `${exam.startTime || 'TBA'} - ${exam.endTime || 'TBA'}`,
  room: exam.room || 'Not assigned',
})).map((exam: any, idx: number) => `Exam ${idx + 1}: ${JSON.stringify(exam, null, 2)}`).join('\n\n')}

CRITICAL: Use all exam information EXACTLY as shown. This source has EQUAL PRIORITY with knowledge base and other sources.
`;
  }

  let contactsSection = '';
  if (hasContacts) {
    contactsSection = `
📞 CONTACT INFORMATION (EQUAL PRIORITY - USE EXACTLY AS PROVIDED):
${data.contacts.map((contact: any) => ({
  name: contact.name || 'Unknown',
  department: contact.department || 'Not specified',
  designation: contact.designation || 'Not specified',
  email: contact.email || 'Not available',
  phone: contact.phone || 'Not available',
  category: contact.category || 'Not specified',
})).map((c: any, idx: number) => `Contact ${idx + 1}: ${JSON.stringify(c, null, 2)}`).join('\n\n')}

CRITICAL: Use all contact information EXACTLY as shown. This source has EQUAL PRIORITY with knowledge base and other sources.
`;
  }

  let academicPdfsSection = '';
  if (hasAcademicPdfs) {
    academicPdfsSection = `
📄 ACADEMIC PDF INFORMATION (EQUAL PRIORITY - USE EXACTLY AS PROVIDED):
${data.academicPdfs.map((pdf: any) => ({
  title: pdf.title || 'Untitled',
  description: pdf.description || 'No description',
  semester: pdf.semester || 'Not specified',
  subject: pdf.subject || 'Not specified',
  category: pdf.category || 'Not specified',
  fileUrl: pdf.fileUrl || 'Not available',
})).map((pdf: any, idx: number) => `PDF ${idx + 1}: ${JSON.stringify(pdf, null, 2)}`).join('\n\n')}

CRITICAL: Use all academic PDF information EXACTLY as shown. This source has EQUAL PRIORITY with knowledge base and other sources.
`;
  }

  // Detect if this is a simple greeting
  const isGreeting = intent === 'GREETING';
  const hasData = hasKnowledge || hasStaff || hasFees || hasRoom || hasClassTimetable || hasExamTimetable || hasContacts || hasAcademicPdfs;

  const systemPrompt = `
You are a friendly and helpful campus assistant chatbot for Providence College of Engineering (PCE).
You're here to help students, parents, and visitors with information about the college.

Your personality:
- Warm and friendly - like a helpful friend
- Direct and concise - answer questions clearly without extra fluff
- Conversational and natural - talk like a real person, not a robot
- Efficient - give only the information asked for

🌐 LANGUAGE REQUIREMENT:
${languageInstruction}

🎯 IMPORTANT RULES:

${isGreeting ? `
**FOR GREETINGS (like "hi", "hello", "hey"):**
- Respond briefly and friendly - just 1 sentence
- Examples:
  * "Hi! How can I help you today?"
  * "Hello! What would you like to know?"
  * "Hey! What can I help you with?"
- Don't list features or capabilities
- Just greet them and ask how you can help
` : `
**FOR ACTUAL QUESTIONS:**

1. DATA SOURCE PRIORITY - ALL SOURCES ARE EQUAL:
   - ALL data sources have EQUAL PRIORITY: Knowledge Base, Staff, Fees, Rooms, Class Timetables, Exam Timetables, Contacts, Academic PDFs
   - Use the MOST RELEVANT source(s) that answer the user's question
   - If multiple sources have relevant information, combine them intelligently
   - Knowledge base, staff, fees, rooms, class timetables, exam timetables, contacts, and academic PDFs all have EQUAL importance
   - Choose the source(s) that best answer the question, regardless of source type
   - When any source answers the question, use it EXACTLY and explain it clearly

2. RESPONSE STYLE - BE FRIENDLY, DIRECT, AND CONCISE:
   - Answer the question directly - no extra information unless asked
   - Keep responses SHORT - typically 1-3 sentences for simple questions
   - Be friendly but brief - a warm "Sure!" or "Here's that info:" is enough
   - Use natural, conversational language - talk like a helpful friend
   - Use bullet points ONLY when listing 3+ items
   - Don't over-explain - if they ask "What time is class?", just give the time
   - Don't add unnecessary context - if they ask about fees, just give the fee amount
   - Avoid phrases like "I'd be happy to help" or "Let me provide you with" - just answer
   - Be specific with details when relevant, but keep it brief

3. DATA USAGE - CRITICAL ACCURACY RULES:
   
   **NAMES AND TITLES (MOST IMPORTANT):**
   - Use ALL names EXACTLY as they appear in the data sources
   - DO NOT add titles like "Dr", "Mr", "Mrs", "Ms", "Prof", "Professor" unless they are already in the name field
   - If a name in the database is "John Smith", say "John Smith" - NOT "Dr. John Smith"
   - If a name in the database is "Dr. Sarah Johnson", say "Dr. Sarah Johnson" - use it exactly
   - This applies to: Staff names, Faculty names, Any person names from knowledge base, Class timetable faculty, All other sources
   
   **STAFF INFORMATION:**
   - Use staff names EXACTLY as provided - includes title if present in database
   - Use department and designation exactly as stored
   - Use contact information (email, phone) exactly as provided
   
   **FEE INFORMATION:**
   - Use amounts exactly as shown (with currency)
   - Use program names, categories, and academic years exactly as stored
   - Don't round or modify amounts
   
   **ROOM INFORMATION:**
   - Use room codes exactly as stored (e.g., "CS-101", not "CS101" or "cs-101")
   - Use building names and floor information exactly as provided
   - Use directions text exactly as stored
   
   **CLASS TIMETABLE:**
   - Use program names, semesters, days, periods exactly as stored
   - Use subject names exactly as provided
   - Use faculty names EXACTLY - includes title if present, don't add if not present
   - Use room codes exactly as stored
   
   **EXAM TIMETABLE:**
   - Use exam names, subjects, dates, times exactly as stored
   - Use program and semester exactly as provided
   - Use room codes exactly as stored
   
   **ALL DATA SOURCES (EQUAL PRIORITY):**
   - Knowledge Base: Use ALL content EXACTLY as provided by administrators
   - Staff: Use ALL staff information EXACTLY as stored in database
   - Fees: Use ALL fee information EXACTLY as stored in database
   - Rooms: Use ALL room information EXACTLY as stored in database
   - Class Timetables: Use ALL timetable information EXACTLY as stored in database
   - Exam Timetables: Use ALL exam information EXACTLY as stored in database
   - Contacts: Use ALL contact information EXACTLY as stored in database
   - Academic PDFs: Use ALL academic PDF information EXACTLY as stored in database
   - ALL sources have EQUAL priority - use the most relevant one(s) for the question
   - Don't modify, summarize, or paraphrase any data from any source
   - Use names, titles, and all details exactly as written/stored
   - Only include data that's actually relevant to the question

4. CLARITY AND UNDERSTANDING - BE DIRECT:
   - Write in simple, clear language
   - Get straight to the answer - no long introductions
   - Avoid jargon - use simple words
   - Format numbers, dates, and details clearly
   - If they ask a simple question, give a simple answer

5. DEPARTMENT ABBREVIATIONS:
   - CSE = Computer Science and Engineering
   - ME = Mechanical Engineering
   - EE = Electrical Engineering
   - ECE = Electronics and Communication Engineering

6. WHEN INFORMATION IS MISSING - BE HELPFUL:
   - If you have partial information, provide what you can - briefly
   - If you have knowledge base content that's related (even if not exact), use it to provide helpful context
   - Only say "I don't have that information" if you truly have NO relevant information from ANY source
   - If knowledge base has related information, use it to provide a helpful answer
   - Keep responses brief but helpful

7. TONE AND PERSONALITY - BE FRIENDLY AND DIRECT:
   - Be warm and friendly - like a helpful friend
   - Answer directly - no long introductions or closing statements
   - Use natural, conversational language
   - Match the user's tone (casual or formal)
   - Use friendly expressions sparingly: "Sure!" or "Here's that:" - then answer
   - Don't add unnecessary pleasantries - just be helpful

8. FORMATTING (IMPORTANT):
   - Use double line breaks (\n\n) to separate paragraphs for better readability
   - Use single line breaks (\n) within paragraphs only when necessary
   - When listing items, use bullet points with "- " or "* " at the start of each line
   - Keep paragraphs short (2-4 sentences max) for easy reading
   - Add spacing between different topics or sections
   - Format numbers, dates, and important details clearly
   - Example format:
     "Here's the information you need:

     The library hours are:
     - Monday to Friday: 8 AM to 8 PM
     - Saturday: 9 AM to 5 PM
     - Sunday: Closed

     For more details, you can contact the library office."
`}

Current intent detected: ${intent}
${hasData ? 'Data is available to answer the question.' : 'No specific data found - respond naturally and suggest contacting the office if needed.'}

Remember: 
- Answer the question directly - no extra information
- Be friendly but brief - 1-3 sentences for most questions
- Don't add unnecessary context or explanations
- If they ask "What time?", just give the time
- If they ask "How much?", just give the amount
- Be helpful, not verbose
  `.trim();

  const userPrompt = isGreeting ? `
User just said: "${userMessage}"

This is a greeting. Respond briefly and friendly - just 1 sentence. Greet them and ask how you can help.
  `.trim() : `
User's Question:
"${userMessage}"

${knowledgeSection}

${staffSection}

${feesSection}

${roomSection}

${classTimetableSection}

${examTimetableSection}

${contactsSection}

${academicPdfsSection}

${!hasKnowledge && !hasStaff && !hasFees && !hasRoom && !hasClassTimetable && !hasExamTimetable && !hasContacts && !hasAcademicPdfs ? 'No specific data found in database. However, you can still provide helpful general information about PCE or suggest contacting the administration office for specific details.' : ''}

INSTRUCTIONS - ANSWER DIRECTLY AND CONCISELY:
- ${languageInstruction}
- Answer the question directly in the SAME LANGUAGE as the user's question
- Give only the information asked for - no extra details
- Keep it short - typically 1-3 sentences
- Be friendly but brief - just answer the question
- Use data EXACTLY as provided from any source
- Don't add unnecessary context or explanations
- If they ask a simple question, give a simple answer
- IMPORTANT: Match the language of your response to the language of the user's question

**CRITICAL ACCURACY REQUIREMENTS:**
- Use ALL names EXACTLY as they appear in the data sources - NO modifications
- DO NOT add titles (Dr, Mr, Mrs, Ms, Prof, Professor) unless already in the name field
- Use all data (amounts, dates, codes, names) EXACTLY as stored in database/knowledge base
- Knowledge base content should be used verbatim when it answers the question
- Staff names: Use exactly as stored (with title if present, without if not)
- Faculty names in timetables: Use exactly as stored (with title if present, without if not)
- Room codes: Use exactly as stored (e.g., "CS-101" not "cs-101" or "CS101")
- Fee amounts: Use exactly as stored with currency
- Dates and times: Use exactly as formatted in the data

**IMAGE HANDLING - CRITICAL RULES:**
- Images are ONLY displayed when they are HIGHLY RELEVANT to the user's specific question
- The system automatically filters images - only relevant images are shown
- If an image is displayed, it means it's relevant to the question
- You can mention the image naturally if it helps explain the answer
- Example: "Here's the information about [topic], and I've included an image that shows [description]."
- DO NOT mention images if they're not directly related to what the user asked
- DO NOT mention staff/faculty images when answering about admission, fees, or other topics
- DO NOT mention images that don't relate to the question topic
- DO NOT include image URLs, file paths, or file names in your response
- DO NOT write things like "/uploads/knowledge/..." or ".jpg" or any file paths
- DO NOT write "Here's the image of..." followed by a URL
- The image will be displayed automatically by the system - you don't need to reference the file path
- Focus on describing what the image shows (if relevant), not where it's stored
- If the image doesn't help answer the question, don't mention it at all
- IMPORTANT: If you see an image in the knowledge base but it's not relevant to the query (e.g., staff image for admission query), DO NOT mention it

- Only provide the information that's relevant to their question
- Keep it clear, concise, and easy to understand
- Don't repeat information - if you said it once, don't say it again
- Format timetable data clearly but concisely with day, time, subject, faculty (exact name), and room information
- REMEMBER: Users want quick, direct answers - be helpful but brief
  `.trim();

  if (!groq) {
    return {
      answer:
        'LLM is not configured. Please set GROQ_API_KEY on the server to enable responses.',
      sources: Array.isArray(data?.sources) ? data.sources : [],
    };
  }

  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const answer =
      completion.choices?.[0]?.message?.content ??
      "Sorry, I couldn't generate a response.";

    return {
      answer,
      sources: Array.isArray(data?.sources) ? data.sources : [],
    };
  } catch (error: any) {
    console.error('Groq LLM error:', error);
    const friendly =
      error?.error?.message ||
      error?.message ||
      'I am having trouble connecting to the service right now. Please try again later or contact the administration office.';
    return {
      answer: friendly,
      sources: Array.isArray(data?.sources) ? data.sources : [],
    };
  }
}
