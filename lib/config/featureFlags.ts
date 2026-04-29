/**
 * Feature flags — flip these during a live demo.
 * Next.js dev mode hot-reloads this file immediately on save.
 *
 * Usage:
 *   import { FLAGS } from '@/lib/config/featureFlags';
 *   if (FLAGS.AI_QUESTS) { ... }
 */
export const FLAGS: Record<string, boolean> = {
  /** AI-powered weekly spending challenges. Set true to reveal during demo. */
  AI_QUESTS: false,
};
