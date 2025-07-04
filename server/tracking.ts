import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { 
  userSessions, 
  featureUsage, 
  apiRequests, 
  securityEvents, 
  systemAlerts,
  adminActions,
  performanceMetrics,
  InsertUserSession,
  InsertFeatureUsage,
  InsertApiRequest,
  InsertSecurityEvent,
  InsertSystemAlert,
  InsertAdminAction,
  InsertPerformanceMetric
} from '../shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

export class TrackingService {
  // User Session Tracking
  static async createUserSession(sessionData: InsertUserSession) {
    try {
      const [session] = await db.insert(userSessions)
        .values(sessionData)
        .returning();
      return session;
    } catch (error) {
      console.error('Error creating user session:', error);
      throw error;
    }
  }

  static async updateUserSession(sessionToken: string, updates: Partial<InsertUserSession>) {
    try {
      const [session] = await db.update(userSessions)
        .set({ ...updates, lastActiveTime: new Date() })
        .where(eq(userSessions.sessionToken, sessionToken))
        .returning();
      return session;
    } catch (error) {
      console.error('Error updating user session:', error);
      throw error;
    }
  }

  static async endUserSession(sessionToken: string) {
    try {
      await db.update(userSessions)
        .set({ 
          logoutTime: new Date(), 
          isActive: false 
        })
        .where(eq(userSessions.sessionToken, sessionToken));
    } catch (error) {
      console.error('Error ending user session:', error);
      throw error;
    }
  }

  static async getActiveUserSessions(timeframe: '7d' | '30d' = '7d') {
    try {
      const days = timeframe === '7d' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return await db.select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.isActive, true),
            gte(userSessions.lastActiveTime, cutoffDate)
          )
        );
    } catch (error) {
      console.error('Error getting active user sessions:', error);
      return [];
    }
  }

  // Feature Usage Tracking
  static async trackFeatureUsage(usageData: InsertFeatureUsage) {
    try {
      const [usage] = await db.insert(featureUsage)
        .values(usageData)
        .returning();
      return usage;
    } catch (error) {
      console.error('Error tracking feature usage:', error);
      throw error;
    }
  }

  static async getFeatureUsageStats(featureName?: string, days: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      if (featureName) {
        return await db.select()
          .from(featureUsage)
          .where(
            and(
              gte(featureUsage.timestamp, cutoffDate),
              eq(featureUsage.featureName, featureName)
            )
          )
          .orderBy(desc(featureUsage.timestamp));
      } else {
        return await db.select()
          .from(featureUsage)
          .where(gte(featureUsage.timestamp, cutoffDate))
          .orderBy(desc(featureUsage.timestamp));
      }
    } catch (error) {
      console.error('Error getting feature usage stats:', error);
      return [];
    }
  }

  // API Request Tracking
  static async trackApiRequest(requestData: InsertApiRequest) {
    try {
      const [request] = await db.insert(apiRequests)
        .values(requestData)
        .returning();
      return request;
    } catch (error) {
      console.error('Error tracking API request:', error);
      throw error;
    }
  }

  static async getApiRequestStats(days: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const requests = await db.select()
        .from(apiRequests)
        .where(gte(apiRequests.timestamp, cutoffDate))
        .orderBy(desc(apiRequests.timestamp));

      // Calculate stats
      const total = requests.length;
      const errors5xx = requests.filter(r => r.statusCode >= 500).length;
      const errors4xx = requests.filter(r => r.statusCode >= 400 && r.statusCode < 500).length;
      const avgResponseTime = requests.reduce((sum, r) => sum + r.responseTime, 0) / total || 0;
      const errorRate = ((errors4xx + errors5xx) / total) * 100 || 0;

      return {
        total,
        errors4xx,
        errors5xx,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100) / 100
      };
    } catch (error) {
      console.error('Error getting API request stats:', error);
      return {
        total: 0,
        errors4xx: 0,
        errors5xx: 0,
        avgResponseTime: 0,
        errorRate: 0
      };
    }
  }

  // Security Event Tracking
  static async logSecurityEvent(eventData: InsertSecurityEvent) {
    try {
      const [event] = await db.insert(securityEvents)
        .values(eventData)
        .returning();
      return event;
    } catch (error) {
      console.error('Error logging security event:', error);
      throw error;
    }
  }

  static async getSecurityEventStats(days: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const events = await db.select()
        .from(securityEvents)
        .where(gte(securityEvents.timestamp, cutoffDate));

      const failedLogins = events.filter(e => e.eventType === 'login_failed').length;
      const passwordResets = events.filter(e => e.eventType === 'password_reset').length;
      const accountLockouts = events.filter(e => e.eventType === 'account_locked').length;

      return {
        failedLogins,
        passwordResets,
        accountLockouts,
        totalEvents: events.length
      };
    } catch (error) {
      console.error('Error getting security event stats:', error);
      return {
        failedLogins: 0,
        passwordResets: 0,
        accountLockouts: 0,
        totalEvents: 0
      };
    }
  }

  // System Alert Tracking
  static async createSystemAlert(alertData: InsertSystemAlert) {
    try {
      const [alert] = await db.insert(systemAlerts)
        .values(alertData)
        .returning();
      return alert;
    } catch (error) {
      console.error('Error creating system alert:', error);
      throw error;
    }
  }

  static async getSystemAlertStats(days: number = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const alerts = await db.select()
        .from(systemAlerts)
        .where(gte(systemAlerts.timestamp, cutoffDate));

      const openIssues = alerts.filter(a => !a.resolved).length;
      const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
      const lastIncident = alerts.length > 0 ? 
        alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp : null;

      return {
        openIssues,
        criticalAlerts,
        lastIncident
      };
    } catch (error) {
      console.error('Error getting system alert stats:', error);
      return {
        openIssues: 0,
        criticalAlerts: 0,
        lastIncident: null
      };
    }
  }

  // Admin Action Tracking
  static async logAdminAction(actionData: InsertAdminAction) {
    try {
      const [action] = await db.insert(adminActions)
        .values(actionData)
        .returning();
      return action;
    } catch (error) {
      console.error('Error logging admin action:', error);
      throw error;
    }
  }

  static async getLastAdminAction() {
    try {
      const [lastAction] = await db.select()
        .from(adminActions)
        .orderBy(desc(adminActions.timestamp))
        .limit(1);
      return lastAction?.timestamp || null;
    } catch (error) {
      console.error('Error getting last admin action:', error);
      return null;
    }
  }

  // Performance Metrics
  static async recordPerformanceMetrics(metricsData: InsertPerformanceMetric) {
    try {
      const [metrics] = await db.insert(performanceMetrics)
        .values(metricsData)
        .returning();
      return metrics;
    } catch (error) {
      console.error('Error recording performance metrics:', error);
      throw error;
    }
  }

  static async getLatestPerformanceMetrics() {
    try {
      const [latest] = await db.select()
        .from(performanceMetrics)
        .orderBy(desc(performanceMetrics.timestamp))
        .limit(1);
      return latest;
    } catch (error) {
      console.error('Error getting latest performance metrics:', error);
      return null;
    }
  }
}

// Middleware for API request tracking
export const apiTrackingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    const responseSize = chunk ? Buffer.byteLength(chunk, encoding) : 0;

    // Track the API request
    setImmediate(async () => {
      try {
        await TrackingService.trackApiRequest({
          method: req.method,
          endpoint: req.path,
          statusCode: res.statusCode,
          responseTime,
          ipAddress: req.ip || req.connection.remoteAddress || null,
          userAgent: req.get('User-Agent') || null,
          userId: req.user?.id || null,
          errorMessage: res.statusCode >= 400 ? 'HTTP Error' : null,
          requestSize: req.get('content-length') ? parseInt(req.get('content-length')!) : null,
          responseSize
        });
      } catch (error) {
        // Don't let tracking errors affect the response
        console.error('Error in API tracking middleware:', error);
      }
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Middleware for feature usage tracking
export const featureTrackingMiddleware = (featureName: string, action: string = 'access') => {
  return (req: Request, res: Response, next: NextFunction) => {
    setImmediate(async () => {
      try {
        await TrackingService.trackFeatureUsage({
          userId: req.user?.id || null,
          featureName,
          action,
          entityType: null,
          entityId: null,
          ipAddress: req.ip || req.connection.remoteAddress || null,
          userAgent: req.get('User-Agent') || null,
          duration: null,
          metadata: null
        });
      } catch (error) {
        console.error('Error in feature tracking middleware:', error);
      }
    });
    next();
  };
};

// Performance monitoring function
export const startPerformanceMonitoring = () => {
  setInterval(async () => {
    try {
      const memoryUsage = process.memoryUsage();
      const memoryUsagePercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
      
      await TrackingService.recordPerformanceMetrics({
        cpuUsage: null, // Would need additional library
        memoryUsage: memoryUsagePercent,
        diskUsage: null, // Would need additional library
        activeConnections: null, // Would need server-specific tracking
        requestsPerSecond: null, // Would need request counting
        errorRate: null, // Would need error rate calculation
        averageResponseTime: null, // Would need response time tracking
        uptime: Math.floor(process.uptime())
      });
    } catch (error) {
      console.error('Error recording performance metrics:', error);
    }
  }, 5 * 60 * 1000); // Record every 5 minutes
};