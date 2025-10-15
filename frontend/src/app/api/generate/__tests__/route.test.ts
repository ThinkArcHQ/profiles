import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock the AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toDataStreamResponse: vi.fn(() => new Response('mock stream')),
  })),
}));

// Mock the AI config
vi.mock('@/lib/ai-config', () => ({
  getAIModel: vi.fn(() => 'mock-model'),
  DEFAULT_GENERATION_CONFIG: {
    temperature: 0.7,
    maxTokens: 4000,
    topP: 0.9,
  },
}));

// Mock the prompts
vi.mock('@/lib/prompts/profile-generator', () => ({
  getProfileGeneratorSystemMessage: vi.fn(() => ({
    role: 'system',
    content: 'mock system prompt',
  })),
  buildProfileGenerationPrompt: vi.fn((prompt: string) => prompt),
}));

describe('/api/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject requests without a prompt', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Prompt is required');
  });

  it('should reject requests with empty prompt', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt: '   ' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Prompt is required');
  });

  it('should reject requests with prompt exceeding 10000 characters', async () => {
    const longPrompt = 'a'.repeat(10001);
    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt: longPrompt }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('less than 10,000 characters');
  });

  it('should reject requests with more than 5 images', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'Create a profile',
        files: {
          images: Array(6).fill({
            name: 'test.png',
            mimeType: 'image/png',
            base64Data: 'data:image/png;base64,test',
          }),
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Maximum 5 images');
  });

  it('should reject requests with invalid image format', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'Create a profile',
        files: {
          images: [{ name: 'test.png' }], // Missing mimeType and base64Data
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('must have name, mimeType, and base64Data');
  });

  it('should accept valid requests with prompt only', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'Create a beautiful profile page',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('should accept valid requests with images', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'Create a profile page',
        files: {
          images: [
            {
              name: 'profile.png',
              mimeType: 'image/png',
              base64Data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            },
          ],
        },
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('should accept valid requests with documents', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'Create a profile page',
        files: {
          documents: [
            {
              name: 'resume.pdf',
              text: 'John Doe\nSoftware Engineer\nExperience: 5 years',
            },
          ],
        },
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('should accept valid requests with conversation history', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'Make it more colorful',
        conversationHistory: [
          { role: 'user', content: 'Create a profile page' },
          { role: 'assistant', content: 'Here is your profile page...' },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });
});
