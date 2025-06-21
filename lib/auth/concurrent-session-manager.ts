import { logger } from '@/lib/core/debug/server-logger';
import type { User, Session } from 'better-auth/types';

interface SessionInfo {
  id: string;
  userId: string;
  deviceName?: string;
  deviceType?: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  location?: {
    country?: string;
    city?: string;
  };
}

interface ConcurrentSessionPolicy {
  maxSessions: number;
  allowMultiDevice: boolean;
  sessionTimeout: number; // in milliseconds
  idleTimeout: number; // in milliseconds
  strategy: 'reject_new' | 'terminate_oldest' | 'terminate_inactive';
}

class ConcurrentSessionManager {
  private readonly DEFAULT_POLICY: ConcurrentSessionPolicy = {
    maxSessions: 3,
    allowMultiDevice: true,
    sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
    idleTimeout: 30 * 60 * 1000, // 30 minutes
    strategy: 'terminate_oldest',
  };
  
  // Role-based policies
  private readonly ROLE_POLICIES: Record<string, Partial<ConcurrentSessionPolicy>> = {
    admin: {
      maxSessions: 2,
      allowMultiDevice: false,
      idleTimeout: 15 * 60 * 1000, // 15 minutes
      strategy: 'reject_new',
    },
    doctor: {
      maxSessions: 3,
      idleTimeout: 20 * 60 * 1000, // 20 minutes
    },
    nurse: {
      maxSessions: 5, // Allow more sessions for shift workers
      idleTimeout: 30 * 60 * 1000, // 30 minutes
    },
    user: {
      maxSessions: 5,
      idleTimeout: 60 * 60 * 1000, // 1 hour
    },
  };
  
  /**
   * Get policy for a user based on their role
   */
  getPolicy(userRole?: string): ConcurrentSessionPolicy {
    const rolePolicy = userRole ? this.ROLE_POLICIES[userRole] : {};
    return {
      ...this.DEFAULT_POLICY,
      ...rolePolicy,
    };
  }
  
  /**
   * Check if a new session can be created
   */
  async canCreateSession(
    userId: string,
    userRole: string,
    currentSessions: SessionInfo[]
  ): Promise<{ allowed: boolean; reason?: string; sessionToTerminate?: string }> {
    const policy = this.getPolicy(userRole);
    const activeSessions = this.getActiveSessions(currentSessions);
    
    logger.auth.debug('Checking concurrent session limit', {
      userId,
      userRole,
      activeSessionCount: activeSessions.length,
      maxAllowed: policy.maxSessions,
    });
    
    // Check if under limit
    if (activeSessions.length < policy.maxSessions) {
      return { allowed: true };
    }
    
    // At or over limit - apply strategy
    switch (policy.strategy) {
      case 'reject_new':
        return {
          allowed: false,
          reason: `Maximum ${policy.maxSessions} concurrent sessions reached`,
        };
        
      case 'terminate_oldest':
        const oldestSession = this.findOldestSession(activeSessions);
        if (oldestSession) {
          return {
            allowed: true,
            sessionToTerminate: oldestSession.id,
          };
        }
        break;
        
      case 'terminate_inactive':
        const inactiveSession = this.findMostInactiveSession(activeSessions);
        if (inactiveSession) {
          return {
            allowed: true,
            sessionToTerminate: inactiveSession.id,
          };
        }
        break;
    }
    
    // Fallback
    return {
      allowed: false,
      reason: 'Session limit reached and no sessions can be terminated',
    };
  }
  
  /**
   * Get list of active sessions
   */
  getActiveSessions(sessions: SessionInfo[]): SessionInfo[] {
    const now = Date.now();
    
    return sessions.filter(session => {
      // Check if expired
      if (session.expiresAt && session.expiresAt.getTime() < now) {
        return false;
      }
      
      // Check if marked as inactive
      if (!session.isActive) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Find the oldest session
   */
  private findOldestSession(sessions: SessionInfo[]): SessionInfo | null {
    if (sessions.length === 0) return null;
    
    return sessions.reduce((oldest, session) => {
      return session.createdAt < oldest.createdAt ? session : oldest;
    });
  }
  
  /**
   * Find the most inactive session
   */
  private findMostInactiveSession(sessions: SessionInfo[]): SessionInfo | null {
    if (sessions.length === 0) return null;
    
    return sessions.reduce((mostInactive, session) => {
      return session.lastActivity < mostInactive.lastActivity ? session : mostInactive;
    });
  }
  
  /**
   * Check for idle sessions that should be terminated
   */
  findIdleSessions(sessions: SessionInfo[], userRole?: string): SessionInfo[] {
    const policy = this.getPolicy(userRole);
    const now = Date.now();
    
    return sessions.filter(session => {
      const idleTime = now - session.lastActivity.getTime();
      return idleTime > policy.idleTimeout;
    });
  }
  
  /**
   * Group sessions by device type
   */
  groupSessionsByDevice(sessions: SessionInfo[]): Map<string, SessionInfo[]> {
    const grouped = new Map<string, SessionInfo[]>();
    
    for (const session of sessions) {
      const deviceKey = session.deviceType || 'unknown';
      const deviceSessions = grouped.get(deviceKey) || [];
      deviceSessions.push(session);
      grouped.set(deviceKey, deviceSessions);
    }
    
    return grouped;
  }
  
  /**
   * Get session summary for user
   */
  getSessionSummary(sessions: SessionInfo[]): {
    total: number;
    active: number;
    idle: number;
    byDevice: Record<string, number>;
    byLocation: Record<string, number>;
    oldestSession?: Date;
    newestSession?: Date;
  } {
    const activeSessions = this.getActiveSessions(sessions);
    const idleSessions = this.findIdleSessions(sessions);
    
    const byDevice: Record<string, number> = {};
    const byLocation: Record<string, number> = {};
    
    for (const session of sessions) {
      // Count by device
      const deviceKey = session.deviceType || 'unknown';
      byDevice[deviceKey] = (byDevice[deviceKey] || 0) + 1;
      
      // Count by location
      const locationKey = session.location?.country || 'unknown';
      byLocation[locationKey] = (byLocation[locationKey] || 0) + 1;
    }
    
    const dates = sessions.map(s => s.createdAt).sort((a, b) => a.getTime() - b.getTime());
    
    return {
      total: sessions.length,
      active: activeSessions.length,
      idle: idleSessions.length,
      byDevice,
      byLocation,
      oldestSession: dates[0],
      newestSession: dates[dates.length - 1],
    };
  }
  
  /**
   * Terminate specific sessions
   */
  async terminateSessions(
    sessionIds: string[],
    reason: string
  ): Promise<{ success: boolean; terminated: string[] }> {
    try {
      // In a real implementation, this would:
      // 1. Delete sessions from database
      // 2. Invalidate tokens
      // 3. Send notifications to affected devices
      // 4. Log the termination event
      
      logger.auth.info('Terminating sessions', {
        sessionIds,
        reason,
        count: sessionIds.length,
      });
      
      // Placeholder for actual termination logic
      // Would integrate with Better Auth session management
      
      return {
        success: true,
        terminated: sessionIds,
      };
    } catch (error) {
      logger.auth.error('Failed to terminate sessions', {
        error: error?.message || error,
        sessionIds,
      });
      
      return {
        success: false,
        terminated: [],
      };
    }
  }
  
  /**
   * Validate session limits before login
   */
  async validateSessionLimits(
    user: User,
    currentSessions: SessionInfo[],
    newSessionInfo: Partial<SessionInfo>
  ): Promise<{
    valid: boolean;
    action?: 'allow' | 'terminate_and_allow' | 'reject';
    message?: string;
    sessionsToTerminate?: string[];
  }> {
    const userRole = (user as any).role || 'user';
    const policy = this.getPolicy(userRole);
    
    // Check device restrictions
    if (!policy.allowMultiDevice && newSessionInfo.deviceType) {
      const existingDeviceTypes = new Set(
        currentSessions.map(s => s.deviceType).filter(Boolean)
      );
      
      if (existingDeviceTypes.size > 0 && !existingDeviceTypes.has(newSessionInfo.deviceType)) {
        return {
          valid: false,
          action: 'reject',
          message: 'Multi-device access not allowed for your account',
        };
      }
    }
    
    // Check concurrent session limit
    const sessionCheck = await this.canCreateSession(
      user.id,
      userRole,
      currentSessions
    );
    
    if (!sessionCheck.allowed) {
      return {
        valid: false,
        action: 'reject',
        message: sessionCheck.reason,
      };
    }
    
    if (sessionCheck.sessionToTerminate) {
      return {
        valid: true,
        action: 'terminate_and_allow',
        sessionsToTerminate: [sessionCheck.sessionToTerminate],
        message: 'Oldest session will be terminated',
      };
    }
    
    return {
      valid: true,
      action: 'allow',
    };
  }
}

export const concurrentSessionManager = new ConcurrentSessionManager();
export type { SessionInfo, ConcurrentSessionPolicy };