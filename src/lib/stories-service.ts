import { ISLAMIC_STORIES, STORY_IDS, IslamicStory } from './islamic-stories';

export type FeaturedStoryResponse = {
  story: IslamicStory;
  featuredDateISO: string;
  nextRotationTs: number; // epoch ms until next local midnight
  totalStories: number;
};

const toDateKey = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Deterministic index based on date key to ensure 24h rotation without persistence.
const indexForDate = (dateKey: string, len: number) => {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  return hash % Math.max(1, len);
};

export function getFeaturedStory(date: Date = new Date()): FeaturedStoryResponse {
  const dateKey = toDateKey(date);
  const idx = indexForDate(dateKey, ISLAMIC_STORIES.length);
  const story = ISLAMIC_STORIES[idx];
  // Next local midnight
  const next = new Date(date);
  next.setHours(24, 0, 0, 0);
  return {
    story,
    featuredDateISO: dateKey,
    nextRotationTs: next.getTime(),
    totalStories: ISLAMIC_STORIES.length,
  };
}

export function getStoryById(id: string): IslamicStory | undefined {
  return ISLAMIC_STORIES.find(s => s.id === id);
}

export function getStories(): IslamicStory[] {
  return ISLAMIC_STORIES.slice();
}

export function getStoryIds(): string[] {
  return STORY_IDS.slice();
}