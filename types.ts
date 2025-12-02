
export interface Task {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  duration: number; // minutes
  targetCount: number; // times per day or week
  videoUrl?: string; // Base64 data URI or external URL
  frequency?: 'daily' | 'weekly';
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  progress: Record<string, number>; // taskId -> count
  notes?: string;
  mood?: 'happy' | 'neutral' | 'tired';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  STATS = 'STATS',
  PLAN = 'PLAN',
  SETTINGS = 'SETTINGS'
}

export const DEFAULT_TASKS: Task[] = [
  {
    id: 'outdoor',
    title: '户外阳光',
    description: '保持每天2小时户外活动，沐浴自然光。',
    icon: 'Sun',
    duration: 120,
    targetCount: 1,
    frequency: 'daily'
  },
  {
    id: 'distant',
    title: '望远',
    description: '远眺20英尺（约6米）外，放松调节。',
    icon: 'Eye',
    duration: 10,
    targetCount: 3,
    frequency: 'daily'
  }
];
