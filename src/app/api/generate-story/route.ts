import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { STORY_CATEGORIES } from '@/lib/aiStoryTemplates';

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
 * AI-powered story generation using OpenAI
 * Generates a Mad Libs-style story template with word placeholders
 */
export async function POST(request: Request) {
  try {
    const { category } = await request.json();

    if (!category || typeof category !== 'string') {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Validate category exists
    const categoryObj = STORY_CATEGORIES.find(
      cat => cat.name.toLowerCase() === category.toLowerCase()
    );

    if (!categoryObj) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to template-based generation
      console.warn('OPENAI_API_KEY not configured, using template-based generation');
      return generateFromTemplate(categoryObj);
    }

    try {
      const openai = getOpenAIClient();
      if (!openai) {
        // Fallback to template-based generation
        return generateFromTemplate(categoryObj);
      }

      // Generate story using OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a creative story generator for a Mad Libs-style game. Generate family-friendly, fun stories with word placeholders in the format [WORD_TYPE]. 

Categories: ${categoryObj.name}
Description: ${categoryObj.description}

Requirements:
- Story should be 3-5 sentences long
- Include 8-15 word placeholders using [WORD_TYPE] format
- Use valid word types: adjective, noun, verb, adverb, plural_noun, past_tense_verb, verb_ing, persons_name, place, number, color, body_part, food, animal, exclamation, emotion
- Make it fun, creative, and appropriate for all ages
- Start with a catchy title suggestion
- The story should fit the category theme`,
          },
          {
            role: 'user',
            content: `Generate a ${categoryObj.name.toLowerCase()} story with word placeholders.`,
          },
        ],
        temperature: 0.9,
        max_tokens: 500,
      });

      const generatedText = completion.choices[0]?.message?.content || '';
      
      // Parse the generated story
      const lines = generatedText.split('\n');
      let title = '';
      let template = '';

      // Extract title (usually first line or after "Title:")
      for (const line of lines) {
        if (line.toLowerCase().includes('title:')) {
          title = line.split(':')[1]?.trim() || '';
        } else if (title && line.trim() && !line.toLowerCase().includes('title')) {
          template += line.trim() + ' ';
        } else if (!title && line.trim() && line.length < 100) {
          title = line.trim().replace(/^["']|["']$/g, '');
        } else if (line.trim() && !line.toLowerCase().includes('title')) {
          template += line.trim() + ' ';
        }
      }

      // If no title found, generate one from first sentence
      if (!title) {
        title = template.split('.')[0]?.trim() || 'Generated Story';
      }

      // Clean up template
      template = template.trim();

      // Extract word types from template
      const WORD_TYPE_REGEX = /\[([A-Z_]+)\]/g;
      const validTypes = [
        'adjective', 'noun', 'verb', 'adverb', 'plural_noun', 
        'past_tense_verb', 'verb_ing', 'persons_name', 'place', 
        'number', 'color', 'body_part', 'food', 'animal', 
        'exclamation', 'emotion'
      ];
      
      const wordTypes: string[] = [];
      let match;
      while ((match = WORD_TYPE_REGEX.exec(template)) !== null) {
        const type = match[1].toLowerCase();
        if (validTypes.includes(type)) {
          wordTypes.push(type);
        }
      }

      // Validate we have a proper template
      if (!template || wordTypes.length === 0) {
        console.warn('AI generation failed, falling back to template');
        return generateFromTemplate(categoryObj);
      }

      return NextResponse.json({
        title: title.substring(0, 100), // Limit title length
        template: template.substring(0, 1000), // Limit template length
        wordTypes,
        generatedBy: 'AI',
      });
    } catch (openaiError: any) {
      console.error('OpenAI generation error:', openaiError);
      // Fallback to template-based generation
      return generateFromTemplate(categoryObj);
    }
  } catch (error: any) {
    console.error('Story generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Fallback function to generate story from templates
 */
function generateFromTemplate(categoryObj: typeof STORY_CATEGORIES[0]) {
  const template = categoryObj.templates[
    Math.floor(Math.random() * categoryObj.templates.length)
  ];
  const title = template.split('...')[0]?.trim() || 'Generated Story Title';

  const WORD_TYPE_REGEX = /\[([A-Z_]+)\]/g;
  const validTypes = [
    'adjective', 'noun', 'verb', 'adverb', 'plural_noun',
    'past_tense_verb', 'verb_ing', 'persons_name', 'place',
    'number', 'color', 'body_part', 'food', 'animal',
    'exclamation', 'emotion'
  ];
  
  const wordTypes: string[] = [];
  let match;
  while ((match = WORD_TYPE_REGEX.exec(template)) !== null) {
    const type = match[1].toLowerCase();
    if (validTypes.includes(type)) {
      wordTypes.push(type);
    }
  }

  return NextResponse.json({
    title,
    template,
    wordTypes,
    generatedBy: 'Template',
  });
}
