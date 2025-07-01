import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export const runtime = 'nodejs'; // Ensure this runs on the Node.js runtime

export async function POST(req: NextRequest) {
  // Feature toggle: disable this route when GPT Vision is active
  if (process.env.USE_GPT_VISION === "true") {
    return NextResponse.json({ message: "This route is disabled because GPT Vision is active." }, { status: 403 });
  }

  try {
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call Google Vision API
    const [result] = await client.textDetection({ image: { content: buffer } });
    const detections = result.textAnnotations;
    const text = detections?.[0]?.description || '';

    return NextResponse.json({ text });
  } catch (error) {
    console.error('OCR upload error:', error);
    return NextResponse.json({ error: 'Failed to extract text from image.' }, { status: 500 });
  }
} 