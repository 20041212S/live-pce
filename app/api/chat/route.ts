import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectIntent, getStaffInfo, getFeeInfo, getRoomDirections, getClassTimetable, getExamTimetable, getContactInfo, getAcademicPdfInfo } from '@/lib/chatHelpers';
import { searchKnowledge } from '@/lib/knowledge';
import { callGroqLLM } from '@/lib/groqLlmService';
import { detectLanguage } from '@/lib/languageDetection';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, clientUserId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!clientUserId) {
      return NextResponse.json(
        { error: 'Client user ID is required' },
        { status: 400 }
      );
    }

    // Detect language and intent
    const detectedLanguage = detectLanguage(message);
    const intent = detectIntent(message);
    const isSimpleGreeting = intent === 'GREETING';

    // Query database - EQUAL PRIORITY: Search ALL sources for EVERY query
    const data: any = {};
    let knowledge: any[] = [];
    
    // For simple greetings, skip all data fetching - just respond naturally
    if (!isSimpleGreeting) {
      // CRITICAL: Search ALL data sources in parallel for EVERY query
      // This ensures equal priority - the LLM will choose the most relevant source(s)
      const searchPromises: Promise<any>[] = [];
      
      // 1. Search knowledge base - ALWAYS search and use as fallback
      // Knowledge base should always be included to ensure we have something to answer with
      searchPromises.push(
        searchKnowledge(message, 10).then(k => {
          knowledge = k;
          // Always include knowledge base results if available, even if other sources are empty
          if (k.length > 0) {
            data.knowledge = k.slice(0, 8); // Include more knowledge entries
          }
        }).catch(err => {
          console.error('Knowledge search error:', err);
          knowledge = [];
        })
      );
      
      // 2. Search ALL other sources in parallel - EQUAL PRIORITY
      // Staff information
      searchPromises.push(
        getStaffInfo(message).then(staff => {
          if (staff && staff.length > 0) data.staff = staff;
        })
      );
      
      // Fee information
      searchPromises.push(
        getFeeInfo(message).then(fees => {
          if (fees && fees.length > 0) data.fees = fees;
        })
      );
      
      // Room/location information
      searchPromises.push(
        getRoomDirections(message).then(room => {
          if (room) data.room = room;
        })
      );
      
      // Class timetable information
      searchPromises.push(
        getClassTimetable(message).then(timetable => {
          if (timetable && timetable.length > 0) data.classTimetable = timetable;
        })
      );
      
      // Exam timetable information
      searchPromises.push(
        getExamTimetable(message).then(exams => {
          if (exams && exams.length > 0) data.examTimetable = exams;
        })
      );
      
      // Contact information - EQUAL PRIORITY
      searchPromises.push(
        getContactInfo(message).then(contacts => {
          if (contacts && contacts.length > 0) data.contacts = contacts;
        })
      );
      
      // Academic PDF information - EQUAL PRIORITY
      searchPromises.push(
        getAcademicPdfInfo(message).then(pdfs => {
          if (pdfs && pdfs.length > 0) data.academicPdfs = pdfs;
        })
      );
      
      // Wait for all searches to complete in parallel
      await Promise.all(searchPromises);
    }

    // Construct sources for UI (RAG-style) from knowledge base
    // Skip sources for simple greetings
    const sources = isSimpleGreeting ? [] : (
      data.knowledge?.map((k: any) => ({
        title: k.name || 'Knowledge Entry',
        source: k.source || 'Admin',
        type: k.type || 'General',
        snippet: k.text?.slice(0, 200) + (k.text?.length > 200 ? '...' : ''),
        imageUrl: k.imageUrl || null,
        imageDescription: k.imageDescription || null,
      })) || []
    );

    // Extract images from ALL relevant sources (knowledge base, rooms, staff, etc.)
    const images = isSimpleGreeting ? [] : (() => {
      const allImages: any[] = [];
      const queryLower = message.toLowerCase().trim();
      const queryIntent = detectIntent(message);
      
      // 1. Extract images from knowledge base (if relevant)
      if (data.knowledge && data.knowledge.length > 0) {
        const topKnowledge = data.knowledge[0];
        const hasImage = topKnowledge.imageUrl && 
                        topKnowledge.imageUrl.trim() && 
                        topKnowledge.imageUrl !== 'null' && 
                        topKnowledge.imageUrl !== 'undefined' &&
                        topKnowledge.imageUrl.trim().length > 0;
        
        if (hasImage) {
          const knowledgeText = (topKnowledge.text || '').toLowerCase();
          const knowledgeName = (topKnowledge.name || '').toLowerCase();
          const knowledgeType = (topKnowledge.type || '').toLowerCase();
          
          // Check relevance - show if query matches knowledge content
          const isRelevant = queryLower.includes('admission') || queryLower.includes('admit') ||
                            queryLower.includes('faculty') || queryLower.includes('staff') ||
                            queryLower.includes('fee') || queryLower.includes('payment') ||
                            knowledgeText.includes(queryLower.split(' ')[0]) ||
                            knowledgeName.includes(queryLower.split(' ')[0]);
          
          // Skip if query is about admission but knowledge is about staff/faculty
          if (queryLower.includes('admission') || queryLower.includes('admit')) {
            if (knowledgeType.includes('staff') || knowledgeType.includes('faculty') ||
                knowledgeName.includes('faculty') || knowledgeName.includes('staff')) {
              // Skip this image
            } else if (isRelevant) {
              let imageUrl = topKnowledge.imageUrl.trim();
              if (!imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
                imageUrl = '/' + imageUrl;
              }
              allImages.push({
                url: imageUrl,
                description: topKnowledge.imageDescription || topKnowledge.name || 'Image from knowledge base',
                title: topKnowledge.name || 'Knowledge Entry',
              });
            }
          } else if (isRelevant) {
            let imageUrl = topKnowledge.imageUrl.trim();
            if (!imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
              imageUrl = '/' + imageUrl;
            }
            allImages.push({
              url: imageUrl,
              description: topKnowledge.imageDescription || topKnowledge.name || 'Image from knowledge base',
              title: topKnowledge.name || 'Knowledge Entry',
            });
          }
        }
      }
      
      // 2. Extract images from rooms (if a room was found, show its image)
      // If data.room exists, it means a room was found matching the query
      if (data.room) {
        const room = data.room;
        if (room.imageUrl && room.imageUrl.trim() && 
            room.imageUrl !== 'null' && room.imageUrl !== 'undefined' &&
            room.imageUrl.trim().length > 0) {
          let imageUrl = room.imageUrl.trim();
          if (!imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
            imageUrl = '/' + imageUrl;
          }
          allImages.push({
            url: imageUrl,
            description: `Room ${room.roomCode || ''} - ${room.buildingName || ''}`,
            title: `Room ${room.roomCode || 'Location'}`,
          });
        }
      }
      
      // 3. Extract images from staff (if query is about staff/faculty)
      if (data.staff && data.staff.length > 0 && 
          (queryIntent === 'STAFF_INFO' || queryLower.includes('facult') || 
           queryLower.includes('staff') || queryLower.includes('teacher') || 
           queryLower.includes('professor') || queryLower.includes('hod'))) {
        // Get the first staff member with an image
        const staffWithImage = data.staff.find((s: any) => 
          s.avatarUrl && s.avatarUrl.trim() && 
          s.avatarUrl !== 'null' && s.avatarUrl !== 'undefined' &&
          s.avatarUrl.trim().length > 0
        );
        
        if (staffWithImage) {
          let imageUrl = staffWithImage.avatarUrl.trim();
          if (!imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
            imageUrl = '/' + imageUrl;
          }
          allImages.push({
            url: imageUrl,
            description: `${staffWithImage.name || 'Staff member'} - ${staffWithImage.designation || ''}`,
            title: staffWithImage.name || 'Staff Member',
          });
        }
      }
      
      return allImages;
    })();
    

    // Enhance data with metadata for better LLM understanding
    const enhancedData = {
      ...data,
      sources,
      metadata: {
        hasKnowledge: knowledge.length > 0,
        knowledgeCount: knowledge.length,
        hasStaff: data.staff && data.staff.length > 0,
        hasFees: data.fees && data.fees.length > 0,
        hasRoom: !!data.room,
        hasClassTimetable: data.classTimetable && data.classTimetable.length > 0,
        hasExamTimetable: data.examTimetable && data.examTimetable.length > 0,
        hasContacts: data.contacts && data.contacts.length > 0,
        hasAcademicPdfs: data.academicPdfs && data.academicPdfs.length > 0,
        intent,
      },
    };

    // Call Groq LLM with enhanced context and detected language
    const llmResponse = await callGroqLLM({
      intent,
      userMessage: message,
      data: enhancedData,
      language: detectedLanguage, // Pass detected language
     });

    // Clean up the answer to remove any image URLs that might have been included
    let cleanedAnswer = llmResponse.answer;
    if (images.length > 0) {
      // Remove image URLs and file paths from the answer
      images.forEach((img: any) => {
        // Remove the image URL if it appears in the text
        if (img.url) {
          cleanedAnswer = cleanedAnswer.replace(new RegExp(img.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
        }
        // Remove common patterns like "/uploads/knowledge/..." or file extensions
        cleanedAnswer = cleanedAnswer.replace(/\/uploads\/knowledge\/[^\s\)]+/gi, '');
        cleanedAnswer = cleanedAnswer.replace(/\([^)]*\.(jpg|jpeg|png|gif|webp)[^)]*\)/gi, '');
      });
      // Clean up any double spaces or awkward spacing
      cleanedAnswer = cleanedAnswer.replace(/\s+/g, ' ').trim();
    }

    // Get or create conversation - ensure it belongs to this client user
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      
      // Verify the conversation belongs to this client user
      if (conversation && conversation.clientUserId !== clientUserId) {
        return NextResponse.json(
          { error: 'Unauthorized: Conversation does not belong to this user' },
          { status: 403 }
        );
      }
    }

    if (!conversation) {
      // Create new conversation with title from first message, associated with client user
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
      conversation = await prisma.conversation.create({
        data: { 
          title,
          clientUserId: clientUserId,
        },
      });
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: 'user',
        content: message,
      },
    });

    // Save assistant response with images if available
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: 'assistant',
        content: cleanedAnswer,
        images: images.length > 0 ? JSON.stringify(images) : null,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
    
    console.log('📤 Sending response with:', {
      answerLength: cleanedAnswer.length,
      imagesCount: images.length,
      imageUrls: images.map((img: any) => img.url),
    });
    
    return NextResponse.json({
      answer: cleanedAnswer,
      sources: llmResponse.sources,
      images: images, // Include images from knowledge base
      conversationId: conversation.id,
    });
   } catch (error: any) {
    console.error('Chat API error:', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { 
        error: error?.message || 'Internal server error',
        answer: "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.",
        sources: []
      },
       { status: 500 }
    );
  }
}

