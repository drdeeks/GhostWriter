
import { NextResponse } from 'next/server';
import { STORY_CATEGORIES } from '@/lib/aiStoryTemplates';

export async function POST(request: Request) {
  try {
    const { category } = await request.json();

    if (!category || typeof category !== 'string') {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const categoryObj = STORY_CATEGORIES.find(cat => cat.name.toLowerCase() === category.toLowerCase());

    if (!categoryObj) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const template = categoryObj.templates[Math.floor(Math.random() * categoryObj.templates.length)];
    const title = template.split('...')[0] || 'Generated Story Title';

    const WORD_TYPE_REGEX = /\[([A-Z_]+)\]/g;
    const validTypes = [
      'adjective','noun','verb','adverb','plural_noun','past_tense_verb','verb_ing','persons_name','place','number','color','body_part','food','animal','exclamation','emotion'
    ];
    let match;
    const wordTypes: string[] = [];
    while ((match = WORD_TYPE_REGEX.exec(template)) !== null) {
      const type = match[1].toLowerCase();
      if (validTypes.includes(type)) wordTypes.push(type);
    }

    return NextResponse.json({ title, template, wordTypes });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
