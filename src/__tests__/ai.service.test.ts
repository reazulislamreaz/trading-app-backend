import { ai_services } from '../app/modules/ai/ai.service';
import * as openaiClient from '../app/modules/ai/openai.client';

jest.mock('../app/modules/ai/openai.client');

const mockChat = openaiClient.chatJsonCompletion as jest.MockedFunction<
  typeof openaiClient.chatJsonCompletion
>;

const baseInput = {
  title: 'EURUSD Long',
  assetType: 'forex',
  symbol: 'EURUSD',
  signalType: 'long',
  timeframe: 'h1',
  entryPrice: 1.085,
  stopLoss: 1.082,
  takeProfit1: 1.091,
};

describe('ai_services.validate_signal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (openaiClient.isOpenAiConfigured as jest.Mock).mockReturnValue(true);
  });

  it('returns fallback when Groq is not configured', async () => {
    (openaiClient.isOpenAiConfigured as jest.Mock).mockReturnValue(false);
    const result = await ai_services.validate_signal(baseInput);
    expect(result.status).toBe('review');
    expect(result.model).toBe('fallback');
    expect(mockChat).not.toHaveBeenCalled();
  });

  it('parses valid Groq JSON response', async () => {
    mockChat.mockResolvedValue(
      JSON.stringify({
        status: 'pass',
        score: 82,
        summary: 'Solid setup',
        risks: ['News risk'],
        suggestedEdits: [],
      })
    );
    const result = await ai_services.validate_signal(baseInput);
    expect(result.status).toBe('pass');
    expect(result.score).toBe(82);
    expect(result.summary).toBe('Solid setup');
    expect(result.risks).toEqual(['News risk']);
  });

  it('maps invalid status to review', async () => {
    mockChat.mockResolvedValue(
      JSON.stringify({ status: 'unknown', score: 10, summary: 'x', risks: [] })
    );
    const result = await ai_services.validate_signal(baseInput);
    expect(result.status).toBe('review');
  });

  it('returns fallback when Groq returns null', async () => {
    mockChat.mockResolvedValue(null);
    const result = await ai_services.validate_signal(baseInput);
    expect(result.model).toBe('fallback');
    expect(result.status).toBe('review');
  });
});

describe('ai_services.assist_master_signal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (openaiClient.isOpenAiConfigured as jest.Mock).mockReturnValue(true);
  });

  it('returns structured assist from Groq', async () => {
    mockChat.mockResolvedValue(
      JSON.stringify({
        summary: 'Overview',
        riskAnalysis: 'SL is tight',
        riskRewardNotes: '1:2 R:R',
        suggestions: ['Widen stop'],
      })
    );
    const result = await ai_services.assist_master_signal(baseInput);
    expect(result.summary).toBe('Overview');
    expect(result.suggestions).toContain('Widen stop');
  });

  it('returns fallback when Groq fails', async () => {
    mockChat.mockResolvedValue(null);
    const result = await ai_services.assist_master_signal(baseInput);
    expect(result.model).toBe('fallback');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
