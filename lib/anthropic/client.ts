import Anthropic from '@anthropic-ai/sdk';

// This file is server-only — never import from client components
// The API key is a server env var (no NEXT_PUBLIC_ prefix)
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
