import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio, generatePlan } from '@/lib/client-planner/engine';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'audio file required' }, { status: 400 });
    }

    // Convert to base64 for Gemini
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = audioFile.type || 'audio/webm';

    // Step 1: Transcribe
    const transcript = await transcribeAudio(base64, mimeType);

    // Step 2: Generate plan
    const plan = await generatePlan(transcript);

    return NextResponse.json({ transcript, plan });
  } catch (err) {
    console.error('Planner error:', err);
    const message = err instanceof Error ? err.message : 'Processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
