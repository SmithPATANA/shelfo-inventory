import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ message: 'Missing image' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert inventory parser. Extract products as JSON.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Read this image and return an array of products. Each product should have: supplier (optional), product type (optional), product name (required), quantity (required), weight (optional), size (optional), purchase price (optional), selling price (optional), and notes (optional). Return only valid JSON.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${image}`
              }
            }
          ]
        }
      ]
    });

    const parsed = response.choices[0].message?.content;
    // Try to parse JSON from the response
    let products = [];
    try {
      // Remove code block markers if present
      const codeBlockMatch = parsed?.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      const jsonString = codeBlockMatch ? codeBlockMatch[1] : parsed;
      products = jsonString ? JSON.parse(jsonString) : [];
    } catch (err) {
      // fallback: return empty array if parsing fails
      products = [];
    }
    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to parse with GPT Vision' }, { status: 500 });
  }
} 