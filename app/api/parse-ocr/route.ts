import { NextRequest, NextResponse } from 'next/server';
import { smartPrompt } from '@/lib/parsePrompt';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  // Feature toggle: disable this route when GPT Vision is active
  if (process.env.USE_GPT_VISION === "true") {
    return NextResponse.json({ message: "This route is disabled because GPT Vision is active." }, { status: 403 });
  }

  try {
    const { rawText } = await req.json();
    if (!rawText) {
      return NextResponse.json({ error: 'Missing rawText' }, { status: 400 });
    }
    const prompt = smartPrompt(rawText);
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 512,
    });
    const responseText = completion.choices[0].message?.content || '';
    let jsonString = responseText;
    // Remove code block markers if present
    const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1];
    }
    let products = [];
    try {
      const parsed = JSON.parse(jsonString);
      products = Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
      console.error('JSON parse error:', err);
      // fallback: try to extract array/object from within the string
    }
    return NextResponse.json({ products });
  } catch (error) {
    console.error('OpenAI parse error:', error);
    return NextResponse.json({ error: 'Failed to parse product data.' }, { status: 500 });
  }
} 