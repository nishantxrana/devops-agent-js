/**
 * Memory module - Lightweight memory system for agent context and state
 * 
 * Provides persistence for notifications, state tracking, and contextual
 * decision making using JSON files (can be upgraded to Redis/SQLite later).
 */

export { memoryManager } from './memoryManager.js';
export { notificationHistory } from './notificationHistory.js';
export { stateManager } from './stateManager.js';