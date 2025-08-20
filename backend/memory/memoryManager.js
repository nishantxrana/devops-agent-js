import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';

/**
 * Lightweight memory manager using JSON files for persistence
 * Can be upgraded to Redis or SQLite later
 */
class MemoryManager {
  constructor() {
    this.memoryDir = path.join(process.cwd(), 'data', 'memory');
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.memoryDir, { recursive: true });
      this.initialized = true;
      logger.info('Memory manager initialized', { memoryDir: this.memoryDir });
    } catch (error) {
      logger.error('Failed to initialize memory manager:', error);
      throw error;
    }
  }

  async store(key, data) {
    await this.initialize();
    
    try {
      const filePath = path.join(this.memoryDir, `${key}.json`);
      const dataWithTimestamp = {
        ...data,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(filePath, JSON.stringify(dataWithTimestamp, null, 2), 'utf8');
      logger.debug('Data stored in memory', { key, timestamp: dataWithTimestamp.timestamp });
      
      return true;
    } catch (error) {
      logger.error('Failed to store data in memory:', error, { key });
      return false;
    }
  }

  async retrieve(key) {
    await this.initialize();
    
    try {
      const filePath = path.join(this.memoryDir, `${key}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(data);
      
      logger.debug('Data retrieved from memory', { key, timestamp: parsed.timestamp });
      return parsed;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.debug('Memory key not found', { key });
        return null;
      }
      logger.error('Failed to retrieve data from memory:', error, { key });
      return null;
    }
  }

  async append(key, item) {
    await this.initialize();
    
    try {
      let existing = await this.retrieve(key) || { items: [] };
      if (!existing.items) existing.items = [];
      
      existing.items.push({
        ...item,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 1000 items to prevent memory bloat
      if (existing.items.length > 1000) {
        existing.items = existing.items.slice(-1000);
      }
      
      return await this.store(key, existing);
    } catch (error) {
      logger.error('Failed to append to memory:', error, { key });
      return false;
    }
  }

  async search(key, predicate) {
    const data = await this.retrieve(key);
    if (!data || !data.items) return [];
    
    return data.items.filter(predicate);
  }

  async exists(key) {
    await this.initialize();
    
    try {
      const filePath = path.join(this.memoryDir, `${key}.json`);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(key) {
    await this.initialize();
    
    try {
      const filePath = path.join(this.memoryDir, `${key}.json`);
      await fs.unlink(filePath);
      logger.debug('Memory key deleted', { key });
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return true; // Already deleted
      }
      logger.error('Failed to delete memory key:', error, { key });
      return false;
    }
  }

  async cleanup(maxAgeHours = 720) { // 30 days default
    await this.initialize();
    
    try {
      const files = await fs.readdir(this.memoryDir);
      const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
      let cleaned = 0;
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        try {
          const filePath = path.join(this.memoryDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const parsed = JSON.parse(data);
          
          if (new Date(parsed.updatedAt || parsed.timestamp) < cutoffTime) {
            await fs.unlink(filePath);
            cleaned++;
          }
        } catch (error) {
          logger.warn('Failed to process memory file during cleanup:', { file, error: error.message });
        }
      }
      
      logger.info('Memory cleanup completed', { filesRemoved: cleaned, maxAgeHours });
      return cleaned;
    } catch (error) {
      logger.error('Memory cleanup failed:', error);
      return 0;
    }
  }
}

export const memoryManager = new MemoryManager();