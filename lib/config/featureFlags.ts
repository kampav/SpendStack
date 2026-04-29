/**
 * Feature flags — flip a value false → true during a live demo, save, and
 * Next.js hot-module-replacement shows the feature instantly.
 *
 * Usage:
 *   import { FLAGS } from '@/lib/config/featureFlags';
 *   if (FLAGS.AI_QUESTS) { ... }
 */
export const FLAGS: Record<string, boolean> = {
  /** AI-powered weekly spending challenges. Set true to reveal during demo. */
  AI_QUESTS: false,

  /** Points redemption store. Set true to reveal during demo. */
  REWARDS_STORE: false,
};
