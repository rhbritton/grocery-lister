import {
  clearGeminiApiKey,
  getGeminiApiKey,
  hasGeminiApiKey,
  setGeminiApiKey,
} from './geminiApiKeyStorage';

const TEST_KEY = 'AIzaSyTestKey123456789012345678901';

describe('geminiApiKeyStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and reads a key per user', () => {
    setGeminiApiKey('user-a', TEST_KEY);
    expect(getGeminiApiKey('user-a')).toBe(TEST_KEY);
    expect(hasGeminiApiKey('user-a')).toBe(true);
    expect(getGeminiApiKey('user-b')).toBeNull();
  });

  it('clears a saved key', () => {
    setGeminiApiKey('user-a', TEST_KEY);
    clearGeminiApiKey('user-a');
    expect(hasGeminiApiKey('user-a')).toBe(false);
  });

  it('rejects empty keys', () => {
    expect(() => setGeminiApiKey('user-a', '   ')).toThrow(/empty/i);
  });

  it('stores any non-empty key string', () => {
    const aqKey = 'AQ.TEST_FAKE_KEY_NOT_A_REAL_SECRET';
    setGeminiApiKey('user-a', aqKey);
    expect(getGeminiApiKey('user-a')).toBe(aqKey);
  });

  it('strips surrounding quotes when saving', () => {
    setGeminiApiKey('user-a', '"AIzaSyTestKey123456789012345678901"');
    expect(getGeminiApiKey('user-a')).toBe('AIzaSyTestKey123456789012345678901');
  });
});
