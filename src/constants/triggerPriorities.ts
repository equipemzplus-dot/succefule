
export type Scenario = 'mission_complete' | 'click_spike' | 'fallback' | 'level_up' | 'streak_milestone' | 'streak_3d';

/**
 * Trigger Priority Levels:
 * Level 1: Sales / Premium Conversion (Highest Priority)
 * Level 2: Engagement / Gamification
 * Level 3: Information / Retention
 */
export const TRIGGER_PRIORITIES: Record<string, number> = {
  // Level 1: Premium Upsells
  'mission_complete': 1,
  'click_spike': 1,
  'fallback': 1,
  'streak_3d': 1,
  
  // Level 2: Engagement (Future use)
  'level_up': 2,
  'streak_milestone': 2,
  
  // Level 3: Info (Future use)
  'daily_reminder': 3
};
