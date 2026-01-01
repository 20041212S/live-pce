import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy-load OpenAI client to avoid initialization during build
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const openai = getOpenAIClient();

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Convert File to a format OpenAI can use
    // OpenAI SDK can accept File objects directly, but we need to ensure proper format
    const audioBuffer = await audioFile.arrayBuffer();
    
    // Create a File object for OpenAI API
    const file = new File([audioBuffer], audioFile.name || 'audio.webm', {
      type: audioFile.type || 'audio/webm',
    });

    // Transcribe using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en', // Optional: specify language for better accuracy
    });

    return NextResponse.json({
      text: transcription.text,
    });
  } catch (error: any) {
    console.error('Speech-to-text error:', error);
    
    // Handle specific OpenAI API errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}


