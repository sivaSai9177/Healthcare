import { logger } from '@/lib/core/debug/server-logger';
import type { User, Session } from 'better-auth/types';

interface SessionContext {
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

interface AnomalyDetectionResult {
  isAnomaly: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  requiresAction: boolean;
  suggestedAction?: 'none' | 'notify' | 'challenge' | 'block';
}

class SessionAnomalyDetector {
  private readonly IP_CHANGE_THRESHOLD_KM = 500; // Distance threshold for IP location changes
  private readonly CONCURRENT_SESSION_LIMIT = 5;
  private readonly RAPID_IP_CHANGE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Detect anomalies in the current session
   */
  async detectAnomalies(
    currentContext: SessionContext,
    previousSessions: { context: SessionContext; timestamp: Date }[],
    user: User
  ): Promise<AnomalyDetectionResult> {
    const anomalies: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    try {
      // Check for rapid IP changes
      const rapidIpChange = this.checkRapidIpChange(currentContext, previousSessions);
      if (rapidIpChange) {
        anomalies.push('Rapid IP address change detected');
        riskLevel = 'medium';
      }
      
      // Check for impossible travel (location-based)
      if (currentContext.location && previousSessions.length > 0) {
        const impossibleTravel = await this.checkImpossibleTravel(
          currentContext,
          previousSessions
        );
        if (impossibleTravel) {
          anomalies.push('Impossible travel detected');
          riskLevel = 'high';
        }
      }
      
      // Check for suspicious user agent changes
      const suspiciousAgent = this.checkSuspiciousUserAgent(currentContext, previousSessions);
      if (suspiciousAgent) {
        anomalies.push('Suspicious user agent change');
        if (riskLevel === 'low') riskLevel = 'medium';
      }
      
      // Check for concurrent sessions
      const concurrentSessions = this.checkConcurrentSessions(previousSessions);
      if (concurrentSessions) {
        anomalies.push(`Too many concurrent sessions (${previousSessions.length})`);
        if (riskLevel !== 'high') riskLevel = 'medium';
      }
      
      // Check for known malicious IPs (placeholder - would integrate with threat intel)
      const maliciousIp = await this.checkMaliciousIp(currentContext.ipAddress);
      if (maliciousIp) {
        anomalies.push('Connection from suspicious IP');
        riskLevel = 'high';
      }
      
      // Determine action based on risk level and anomalies
      const result: AnomalyDetectionResult = {
        isAnomaly: anomalies.length > 0,
        riskLevel,
        reasons: anomalies,
        requiresAction: riskLevel !== 'low',
        suggestedAction: this.determineSuggestedAction(riskLevel, anomalies),
      };
      
      if (result.isAnomaly) {
        logger.auth.warn('Session anomaly detected', {
          userId: user.id,
          email: user.email,
          ...result,
          currentIp: currentContext.ipAddress,
        });
      }
      
      return result;
    } catch (error) {
      logger.auth.error('Error during anomaly detection', {
        error: error?.message || error,
        userId: user.id,
      });
      
      // Return safe defaults on error
      return {
        isAnomaly: false,
        riskLevel: 'low',
        reasons: [],
        requiresAction: false,
        suggestedAction: 'none',
      };
    }
  }
  
  /**
   * Check for rapid IP address changes
   */
  private checkRapidIpChange(
    current: SessionContext,
    previous: { context: SessionContext; timestamp: Date }[]
  ): boolean {
    const recentSessions = previous.filter(
      s => Date.now() - s.timestamp.getTime() < this.RAPID_IP_CHANGE_WINDOW_MS
    );
    
    for (const session of recentSessions) {
      if (session.context.ipAddress !== current.ipAddress) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check for impossible travel based on geolocation
   */
  private async checkImpossibleTravel(
    current: SessionContext,
    previous: { context: SessionContext; timestamp: Date }[]
  ): Promise<boolean> {
    if (!current.location || !current.location.latitude || !current.location.longitude) {
      return false;
    }
    
    for (const session of previous) {
      if (!session.context.location?.latitude || !session.context.location?.longitude) {
        continue;
      }
      
      const distance = this.calculateDistance(
        current.location.latitude,
        current.location.longitude,
        session.context.location.latitude,
        session.context.location.longitude
      );
      
      const timeDiff = Date.now() - session.timestamp.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Assume max travel speed of 1000 km/h (accounting for flights)
      const maxPossibleDistance = hoursDiff * 1000;
      
      if (distance > maxPossibleDistance && distance > this.IP_CHANGE_THRESHOLD_KM) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRad(value: number): number {
    return value * Math.PI / 180;
  }
  
  /**
   * Check for suspicious user agent changes
   */
  private checkSuspiciousUserAgent(
    current: SessionContext,
    previous: { context: SessionContext; timestamp: Date }[]
  ): boolean {
    if (previous.length === 0) return false;
    
    // Extract browser and OS from user agent
    const currentInfo = this.parseUserAgent(current.userAgent);
    
    for (const session of previous) {
      const previousInfo = this.parseUserAgent(session.context.userAgent);
      
      // Suspicious if OS changes (less likely than browser change)
      if (currentInfo.os !== previousInfo.os && previousInfo.os !== 'Unknown') {
        return true;
      }
      
      // Check for automated tools
      if (this.isAutomatedUserAgent(current.userAgent)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Basic user agent parsing
   */
  private parseUserAgent(ua: string): { browser: string; os: string } {
    let os = 'Unknown';
    let browser = 'Unknown';
    
    // OS detection
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    // Browser detection
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    
    return { browser, os };
  }
  
  /**
   * Check if user agent indicates automated tool
   */
  private isAutomatedUserAgent(ua: string): boolean {
    const automatedPatterns = [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
      'python-requests', 'axios', 'postman', 'insomnia'
    ];
    
    const lowerUA = ua.toLowerCase();
    return automatedPatterns.some(pattern => lowerUA.includes(pattern));
  }
  
  /**
   * Check for too many concurrent sessions
   */
  private checkConcurrentSessions(
    sessions: { context: SessionContext; timestamp: Date }[]
  ): boolean {
    // Filter active sessions (within last hour)
    const activeSessions = sessions.filter(
      s => Date.now() - s.timestamp.getTime() < 60 * 60 * 1000
    );
    
    return activeSessions.length > this.CONCURRENT_SESSION_LIMIT;
  }
  
  /**
   * Check if IP is known to be malicious (placeholder)
   */
  private async checkMaliciousIp(ipAddress: string): Promise<boolean> {
    // In production, this would check against threat intelligence feeds
    // For now, just check for obvious patterns
    
    // Check for local/private IPs that shouldn't be in production
    if (process.env.NODE_ENV === 'production') {
      const privateIpPatterns = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^127\./,
        /^::1$/,
        /^localhost$/,
      ];
      
      return privateIpPatterns.some(pattern => pattern.test(ipAddress));
    }
    
    return false;
  }
  
  /**
   * Determine suggested action based on risk assessment
   */
  private determineSuggestedAction(
    riskLevel: 'low' | 'medium' | 'high',
    anomalies: string[]
  ): 'none' | 'notify' | 'challenge' | 'block' {
    if (riskLevel === 'high') {
      // High risk scenarios
      if (anomalies.some(a => a.includes('Impossible travel') || a.includes('suspicious IP'))) {
        return 'block';
      }
      return 'challenge';
    }
    
    if (riskLevel === 'medium') {
      // Medium risk scenarios
      if (anomalies.length > 1) {
        return 'challenge';
      }
      return 'notify';
    }
    
    return 'none';
  }
}

export const sessionAnomalyDetector = new SessionAnomalyDetector();
export type { SessionContext, AnomalyDetectionResult };