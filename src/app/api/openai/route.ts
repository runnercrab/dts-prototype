// src/app/api/openai/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { DTS_SYSTEM_PROMPT } from "@/lib/prompts/dtsPrompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 👇 Esto es lo que ve el navegador con GET
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "API DTS /api/openai funcionando. Envía un POST con { userInput }.",
  });
}

// 👇 Esto es lo que usarás desde tu frontend / HeyGen / formulario
export async function POST(req: NextRequest) {
  try {
    const { userInput } = await req.json();

    if (!userInput) {
      return NextResponse.json(
        { error: "Falta el input del usuario." },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: DTS_SYSTEM_PROMPT },
        { role: "user", content: userInput },
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const message = completion.choices[0]?.message?.content || "Sin respuesta.";

    return NextResponse.json({ output: message });
  } catch (error) {
    console.error("Error en la API DTS:", error);
    return NextResponse.json(
      { error: "Error generando respuesta de OpenAI." },
      { status: 500 }
    );
  }
}
