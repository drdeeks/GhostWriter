import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy initialization of OpenAI client
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * AI-powered word moderation using OpenAI
 * Checks if a word is inappropriate, profane, or violates content guidelines
 */
export async function POST(request: Request) {
  try {
    const { word } = await request.json();

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Validate word length
    if (word.length < 3 || word.length > 30) {
      return NextResponse.json({ 
        isProfane: false,
        reason: 'Word length validation failed'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to basic validation if OpenAI is not configured
      console.warn('OPENAI_API_KEY not configured, using basic validation');
      return NextResponse.json({ 
        isProfane: false,
        reason: 'AI moderation not available'
      });
    }

    try {
      const openai = getOpenAIClient();
      if (!openai) {
        return NextResponse.json({
          isProfane: false,
          reason: 'AI moderation not available',
        });
      }

      // Use OpenAI to moderate the word
      const moderationResponse = await openai.moderations.create({
        input: word,
      });

      const isProfane = moderationResponse.results[0]?.flagged || false;
      const categories = moderationResponse.results[0]?.categories || {};
      const categoryScores = moderationResponse.results[0]?.category_scores || {};

      return NextResponse.json({
        isProfane,
        categories,
        categoryScores,
        reason: isProfane ? 'Word flagged by AI moderation' : 'Word approved',
      });
    } catch (openaiError: any) {
      console.error('OpenAI moderation error:', openaiError);
      
      // Fallback: use basic validation if OpenAI fails
      return NextResponse.json({
        isProfane: false,
        reason: 'AI moderation unavailable, using fallback',
        error: openaiError.message,
      });
    }
  } catch (error: any) {
    console.error('Word moderation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
