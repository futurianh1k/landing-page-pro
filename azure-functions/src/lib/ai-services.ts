/**
 * AI Services Integration
 * Gemini, Claude, ChatGPT
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Initialize clients (lazy initialization to avoid errors when API keys are missing)
let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function normalizeGeminiModelName(model: string): string {
  const trimmed = model.trim();
  if (trimmed.startsWith('models/')) {
    return trimmed.slice('models/'.length);
  }
  return trimmed;
}

function formatProviderError(error: unknown): string {
  const err = error as any;
  const status = err?.status || err?.response?.status;
  const type = err?.error?.type || err?.name;
  const message = err?.error?.message || err?.response?.data?.error?.message || err?.message || 'Unknown error';
  const details = type ? `${type}: ${message}` : message;
  return status ? `${status} ${details}` : details;
}

/**
 * Generate content with Gemini
 */
export async function generateWithGemini(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  // REST API 직접 호출 (SDK 버전 문제 회피)
  // gemini-1.5-flash-latest 모델 사용
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n---\n\n${prompt}` : prompt;

  // v1 API 사용 (v1beta는 일부 모델에서 지원되지 않음)
  const geminiModel = normalizeGeminiModelName(process.env.GEMINI_MODEL || 'gemini-1.5-flash');
  const url = `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: fullPrompt
        }]
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini API error: ${response.status} ${response.statusText} (model=${geminiModel}) - ${errorText}`
    );
  }

  const data = await response.json() as any;
  
  // 안전한 응답 파싱
  if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
    throw new Error(`Gemini API 응답에 candidates가 없습니다. 응답: ${JSON.stringify(data)}`);
  }
  
  const candidate = data.candidates[0];
  if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
    throw new Error(`Gemini API 응답에 content.parts가 없습니다. 응답: ${JSON.stringify(candidate)}`);
  }
  
  const textPart = candidate.content.parts[0];
  if (!textPart.text) {
    throw new Error(`Gemini API 응답에 text가 없습니다. 응답: ${JSON.stringify(textPart)}`);
  }
  
  return textPart.text;
}

/**
 * Generate content with Claude
 */
export async function generateWithClaude(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';
  
  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt || '',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // 안전한 응답 파싱
    if (!message.content || !Array.isArray(message.content) || message.content.length === 0) {
      throw new Error(`Claude API 응답에 content가 없습니다. 응답: ${JSON.stringify(message)}`);
    }

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    throw new Error(`Unexpected response type from Claude: ${content.type}`);
  } catch (error) {
    // API 키 관련 오류인 경우 명확한 메시지 제공
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error(`ANTHROPIC_API_KEY가 유효하지 않거나 설정되지 않았습니다.`);
    }
    throw new Error(`Claude API error (model=${model}): ${formatProviderError(error)}`);
  }
}

/**
 * Generate content with ChatGPT
 */
export async function generateWithChatGPT(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const messages: any[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 4096,
      temperature: 0.7,
    });

    if (!completion.choices || !Array.isArray(completion.choices) || completion.choices.length === 0) {
      throw new Error(`ChatGPT API 응답에 choices가 없습니다. 응답: ${JSON.stringify(completion)}`);
    }

    const message = completion.choices[0]?.message;
    if (!message || !message.content) {
      throw new Error(`ChatGPT API 응답에 message.content가 없습니다. 응답: ${JSON.stringify(completion.choices[0])}`);
    }

    return message.content;
  } catch (error) {
    // API 키 관련 오류인 경우 명확한 메시지 제공
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error(`OPENAI_API_KEY가 유효하지 않거나 설정되지 않았습니다.`);
    }
    throw new Error(`ChatGPT API error: ${formatProviderError(error)}`);
  }
}

/**
 * Generate content with specified AI model
 */
export async function generateContent(
  aiModel: 'gemini' | 'claude' | 'chatgpt',
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  switch (aiModel) {
    case 'gemini':
      // Gemini만 사용, 폴백 없음
      return await generateWithGemini(prompt, systemPrompt);

    case 'claude':
      // Claude만 사용, 폴백 없음
      return await generateWithClaude(prompt, systemPrompt);

    case 'chatgpt':
      // ChatGPT만 사용
      return await generateWithChatGPT(prompt, systemPrompt);

    default:
      throw new Error(`Unsupported AI model: ${aiModel}`);
  }
}
