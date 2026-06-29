/**
 * Shared Type Definitions for AuraChat & Creative Whiteboard
 */

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isEncrypted?: boolean;
  rawCiphertext?: string;
  sentiment?: SentimentData;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

export interface SentimentData {
  emotion: 'Zen' | 'Creative' | 'Excited' | 'Pensive' | 'Anxious' | 'Joyful' | 'Calm' | 'Energetic';
  score: number; // 0 to 100
  color: string; // Hex code for aura
  insight: string;
  recommendation: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string; // Lucide icon identifier
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingPath {
  id: string;
  userId: string;
  userColor: string;
  tool: 'pen' | 'line' | 'rect' | 'circle' | 'eraser';
  points: DrawingPoint[];
  color: string;
  width: number;
}

export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursorX?: number;
  cursorY?: number;
  isDrawing?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'badge' | 'user' | 'error';
  timestamp: string;
}
