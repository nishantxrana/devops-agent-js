import { memoryManager } from './memoryManager.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Manages notification history to avoid duplicate alerts and track notification patterns
 */
class NotificationHistory {
  constructor() {
    this.NOTIFICATIONS_KEY = 'notification-history';
    this.DUPLICATE_THRESHOLD_MINUTES = 60; // Don't send same notification within 1 hour
  }

  /**
   * Generate a hash for notification content to detect duplicates
   */
  generateNotificationHash(type, content, targetId = null) {
    const hashInput = `${type}:${targetId || ''}:${content}`;
    return crypto.createHash('md5').update(hashInput).digest('hex');
  }

  /**
   * Check if a similar notification was sent recently
   */
  async isDuplicate(type, content, targetId = null) {
    try {
      const hash = this.generateNotificationHash(type, content, targetId);
      const cutoffTime = new Date(Date.now() - this.DUPLICATE_THRESHOLD_MINUTES * 60 * 1000);
      
      const recentNotifications = await memoryManager.search(
        this.NOTIFICATIONS_KEY,
        (notification) => {
          return notification.hash === hash && 
                 new Date(notification.timestamp) > cutoffTime;
        }
      );

      return recentNotifications.length > 0;
    } catch (error) {
      logger.error('Error checking notification duplicate:', error);
      return false; // Default to allowing notification if check fails
    }
  }

  /**
   * Record a sent notification
   */
  async recordNotification(type, content, targetId = null, metadata = {}) {
    try {
      const hash = this.generateNotificationHash(type, content, targetId);
      
      const notification = {
        hash,
        type,
        content: content.substring(0, 500), // Store truncated content for memory efficiency
        targetId,
        metadata,
        timestamp: new Date().toISOString()
      };

      await memoryManager.append(this.NOTIFICATIONS_KEY, notification);
      
      logger.debug('Notification recorded in history', {
        type,
        hash,
        targetId,
        timestamp: notification.timestamp
      });

      return true;
    } catch (error) {
      logger.error('Error recording notification:', error);
      return false;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(hoursBack = 24) {
    try {
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      
      const recentNotifications = await memoryManager.search(
        this.NOTIFICATIONS_KEY,
        (notification) => new Date(notification.timestamp) > cutoffTime
      );

      const stats = {
        total: recentNotifications.length,
        byType: {},
        hourlyDistribution: {},
        duplicatesAvoided: 0
      };

      // Count by type
      recentNotifications.forEach(notification => {
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        
        // Hourly distribution
        const hour = new Date(notification.timestamp).getHours();
        stats.hourlyDistribution[hour] = (stats.hourlyDistribution[hour] || 0) + 1;
      });

      // Count duplicates by checking hash frequency
      const hashCounts = {};
      recentNotifications.forEach(notification => {
        hashCounts[notification.hash] = (hashCounts[notification.hash] || 0) + 1;
      });
      
      stats.duplicatesAvoided = Object.values(hashCounts).reduce((sum, count) => {
        return sum + Math.max(0, count - 1);
      }, 0);

      return stats;
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      return { total: 0, byType: {}, hourlyDistribution: {}, duplicatesAvoided: 0 };
    }
  }

  /**
   * Get recent notifications for a specific target
   */
  async getRecentNotificationsForTarget(targetId, hoursBack = 24) {
    try {
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      
      return await memoryManager.search(
        this.NOTIFICATIONS_KEY,
        (notification) => {
          return notification.targetId === targetId && 
                 new Date(notification.timestamp) > cutoffTime;
        }
      );
    } catch (error) {
      logger.error('Error getting target notifications:', error);
      return [];
    }
  }

  /**
   * Check if we should escalate repeated failures
   */
  async shouldEscalateFailures(targetId, failureType, threshold = 3, hoursBack = 6) {
    try {
      const recentFailures = await memoryManager.search(
        this.NOTIFICATIONS_KEY,
        (notification) => {
          const isRecentFailure = new Date(notification.timestamp) > 
                                new Date(Date.now() - hoursBack * 60 * 60 * 1000);
          const matchesTarget = notification.targetId === targetId;
          const matchesType = notification.type.includes(failureType) || 
                            notification.type.includes('failed') ||
                            notification.type.includes('error');
          
          return isRecentFailure && matchesTarget && matchesType;
        }
      );

      const shouldEscalate = recentFailures.length >= threshold;
      
      if (shouldEscalate) {
        logger.info('Escalation condition met', {
          targetId,
          failureType,
          failureCount: recentFailures.length,
          threshold,
          hoursBack
        });
      }

      return {
        shouldEscalate,
        failureCount: recentFailures.length,
        recentFailures: recentFailures.slice(-5) // Return last 5 failures for context
      };
    } catch (error) {
      logger.error('Error checking escalation condition:', error);
      return { shouldEscalate: false, failureCount: 0, recentFailures: [] };
    }
  }

  /**
   * Clean up old notification history
   */
  async cleanup(maxAgeHours = 168) { // 7 days default
    try {
      const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
      
      const data = await memoryManager.retrieve(this.NOTIFICATIONS_KEY);
      if (!data || !data.items) return 0;

      const filteredItems = data.items.filter(notification => 
        new Date(notification.timestamp) > cutoffTime
      );

      const removedCount = data.items.length - filteredItems.length;

      if (removedCount > 0) {
        await memoryManager.store(this.NOTIFICATIONS_KEY, { items: filteredItems });
        logger.info('Notification history cleaned up', { removedCount, maxAgeHours });
      }

      return removedCount;
    } catch (error) {
      logger.error('Error cleaning up notification history:', error);
      return 0;
    }
  }
}

export const notificationHistory = new NotificationHistory();