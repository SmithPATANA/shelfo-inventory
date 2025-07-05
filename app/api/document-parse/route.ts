import mammoth from "mammoth";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return new Response(JSON.stringify({
      success: false,
      error: "No file uploaded"
    }), { status: 400 });
  }

  // read the buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // handle .docx
  const ext = file.name.split(".").pop()?.toLowerCase();
  let textContent = "";
  if (ext === "docx") {
    const mammothResult = await mammoth.extractRawText({ buffer });
    textContent = mammothResult.value;
  } else {
    return new Response(JSON.stringify({
      success: false,
      error: "Unsupported file type"
    }), { status: 400 });
  }

  console.log("Mammoth extracted text:", textContent);

  if (!textContent || textContent.length < 5) {
    return new Response(JSON.stringify({
      success: false,
      error: "No text found in document"
    }), { status: 400 });
  }

  // GPT call
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an inventory extractor. Return JSON array with supplier, productType, productName, quantity, weightKg, size, purchasePrice, sellingPrice`
      },
      {
        role: "user",
        content: textContent
      }
    ],
    temperature: 0
  });

  let structured = completion.choices[0].message.content || "";
  // clean code block
  structured = structured.replace(/```json/g, "").replace(/```/g, "").trim();
  console.log("GPT structured output:", structured);

  return new Response(JSON.stringify({
    success: true,
    extracted: structured
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
} 