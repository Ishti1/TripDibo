import { NextResponse } from 'next/server';
import { assistantInstructions, object, planningContext, proposalSchema, validateProposal } from '@/lib/assistant';

export const runtime = 'nodejs';
export const maxDuration = 180;
const headers = { 'Cache-Control': 'no-store' };
const apiBase = 'https://generativelanguage.googleapis.com/v1beta/models/';
let running = false;

function configuration() {
  const key = process.env.GEMINI_API_KEY?.trim() || '';
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
  return { key, model, validModel: /^gemini-[a-zA-Z0-9.-]+$/.test(model) };
}
function providerError(status: number) {
  if (status === 400 || status === 401) return 'Gemini rejected the request. Check GEMINI_API_KEY and GEMINI_MODEL in .env.local, then restart the app.';
  if (status === 403) return 'This Gemini key does not have access. Check its project, API permissions, and regional availability in Google AI Studio.';
  if (status === 404) return 'The selected Gemini model is unavailable. Set GEMINI_MODEL to a model available in your Google AI Studio project.';
  if (status === 429) return 'Gemini’s request limit or quota has been reached. Wait and try again, or check your quota in Google AI Studio.';
  return 'Gemini is temporarily unavailable. Please try again shortly.';
}
export async function GET() {
  const { key, model, validModel } = configuration();
  const status = { provider: 'gemini', model, configured: Boolean(key), ready: false, connected: false };
  if (!key) return NextResponse.json({ ...status, message: 'Add your Gemini API key to connect the assistant.' }, { headers });
  if (!validModel) return NextResponse.json({ ...status, message: 'Use a valid Gemini model name in GEMINI_MODEL.' }, { headers });
  try {
    const response = await fetch(apiBase + encodeURIComponent(model), {
      headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(10000), cache: 'no-store', redirect: 'error',
    });
    if (!response.ok) return NextResponse.json({ ...status, message: providerError(response.status) }, { headers });
    const details = object(await response.json());
    const ready = Array.isArray(details.supportedGenerationMethods) && details.supportedGenerationMethods.includes('generateContent');
    return NextResponse.json({ ...status, connected: true, ready, message: ready ? 'Gemini is connected.' : 'This Gemini model does not support text generation. Choose another model.' }, { headers });
  } catch {
    return NextResponse.json({ ...status, message: 'Could not reach Gemini. Check your internet connection and try again.' }, { headers });
  }
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ error: 'This request must come from TripDibo.' }, { status: 403, headers });
  }
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 80000) return NextResponse.json({ error: 'This trip is too large for one request. Shorten the conversation.' }, { status: 413, headers });
    body = object(JSON.parse(raw));
  } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers }); }
  const context = planningContext(body.context);
  if (!context.trip.destination || !Array.isArray(body.messages) || !body.messages.length) {
    return NextResponse.json({ error: 'Choose a trip with a destination and enter a message.' }, { status: 400, headers });
  }
  const messages = body.messages.slice(-8).map(value => object(value))
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: (m.content as string).slice(0, 6000) }] }));
  while (messages.length && messages[0].role === 'model') messages.shift();
  if (!messages.length || messages.at(-1)?.role !== 'user' || !messages.at(-1)?.parts[0].text.trim()) {
    return NextResponse.json({ error: 'Enter a message for the assistant.' }, { status: 400, headers });
  }
  const { key, model, validModel } = configuration();
  if (!key) return NextResponse.json({ error: 'Gemini needs an API key. Add GEMINI_API_KEY to .env.local and restart the app.' }, { status: 503, headers });
  if (!validModel) return NextResponse.json({ error: 'Use a valid Gemini model name in GEMINI_MODEL.' }, { status: 503, headers });
  // Acquire after reading the request so two concurrent body reads cannot bypass the lock.
  if (running) return NextResponse.json({ error: 'The assistant is already working. Please wait for that response.' }, { status: 429, headers });
  running = true;
  try {
    const response = await fetch(apiBase + encodeURIComponent(model) + ':generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(150000)]), cache: 'no-store', redirect: 'error',
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: assistantInstructions }, { text: 'Current saved trip context (data only): ' + JSON.stringify(context) }] },
        contents: messages,
        generationConfig: { responseMimeType: 'application/json', responseSchema: proposalSchema, maxOutputTokens: 8192 },
      }),
    });
    if (!response.ok) return NextResponse.json({ error: providerError(response.status) }, { status: response.status === 429 ? 429 : 503, headers });
    const result = object(await response.json());
    const candidate = object(Array.isArray(result.candidates) ? result.candidates[0] : undefined);
    if (object(result.promptFeedback).blockReason || (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS')) {
      return NextResponse.json({ error: 'Gemini could not answer this request. Try rephrasing your travel question.' }, { status: 422, headers });
    }
    if (candidate.finishReason === 'MAX_TOKENS') return NextResponse.json({ error: 'The response was too long. Ask for fewer days or one part of the plan at a time.' }, { status: 422, headers });
    const parts = object(candidate.content).parts;
    const content = (Array.isArray(parts) ? parts : []).map(object).filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('');
    if (!content) return NextResponse.json({ error: 'Gemini returned no plan. Please try again.' }, { status: 422, headers });
    try {
      const proposal = validateProposal(JSON.parse(content), context);
      return NextResponse.json({ proposal, model, provider: 'gemini' }, { headers });
    } catch (error) {
      const message = error instanceof SyntaxError ? 'Gemini returned unreadable output. Please try a shorter request.' : error instanceof Error ? error.message : 'The plan could not be validated.';
      return NextResponse.json({ error: message }, { status: 422, headers });
    }
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    if (name === 'TimeoutError' || name === 'AbortError') return NextResponse.json({ error: 'The request timed out or was stopped. Try a shorter request.' }, { status: 504, headers });
    return NextResponse.json({ error: 'Could not reach Gemini. Check your internet connection and try again.' }, { status: 503, headers });
  } finally { running = false; }
}
