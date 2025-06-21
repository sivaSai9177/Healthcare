import { logger } from '@/lib/core/debug/server-logger';

interface GeolocationData {
  ip: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  isVpn?: boolean;
  isProxy?: boolean;
  isTor?: boolean;
  isHosting?: boolean;
}

interface GeolocationSecurityCheck {
  allowed: boolean;
  reason?: string;
  riskLevel: 'low' | 'medium' | 'high';
  details: {
    isRestrictedCountry: boolean;
    isVpnDetected: boolean;
    isProxyDetected: boolean;
    isTorDetected: boolean;
    isHostingProvider: boolean;
  };
}

class GeolocationService {
  private cache = new Map<string, { data: GeolocationData; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  
  // Countries that might require additional verification
  private readonly HIGH_RISK_COUNTRIES = new Set([
    'CN', 'RU', 'KP', 'IR', 'SY', 'CU', 'VE'
  ]);
  
  // Countries where service is restricted (example)
  private readonly BLOCKED_COUNTRIES = new Set([
    // Add country codes as needed based on compliance requirements
  ]);
  
  /**
   * Get geolocation data for an IP address
   */
  async getGeolocation(ip: string): Promise<GeolocationData | null> {
    // Check cache first
    const cached = this.cache.get(ip);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    
    try {
      // In production, use a proper IP geolocation API
      // For now, return mock data based on IP patterns
      const geoData = await this.fetchGeolocationData(ip);
      
      // Cache the result
      if (geoData) {
        this.cache.set(ip, { data: geoData, timestamp: Date.now() });
      }
      
      return geoData;
    } catch (error) {
      logger.auth.error('Failed to get geolocation data', {
        ip,
        error: error?.message || error
      });
      return null;
    }
  }
  
  /**
   * Perform security checks based on geolocation
   */
  async performSecurityCheck(ip: string): Promise<GeolocationSecurityCheck> {
    const geoData = await this.getGeolocation(ip);
    
    if (!geoData) {
      // If we can't get geo data, allow but flag as medium risk
      return {
        allowed: true,
        reason: 'Unable to verify location',
        riskLevel: 'medium',
        details: {
          isRestrictedCountry: false,
          isVpnDetected: false,
          isProxyDetected: false,
          isTorDetected: false,
          isHostingProvider: false,
        }
      };
    }
    
    const details = {
      isRestrictedCountry: this.isRestrictedCountry(geoData.countryCode),
      isVpnDetected: geoData.isVpn || false,
      isProxyDetected: geoData.isProxy || false,
      isTorDetected: geoData.isTor || false,
      isHostingProvider: geoData.isHosting || false,
    };
    
    // Determine if access should be blocked
    if (geoData.countryCode && this.BLOCKED_COUNTRIES.has(geoData.countryCode)) {
      return {
        allowed: false,
        reason: 'Access not available in your region',
        riskLevel: 'high',
        details
      };
    }
    
    // Calculate risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const risks = [];
    
    if (details.isTorDetected) {
      riskLevel = 'high';
      risks.push('Tor network detected');
    } else if (details.isVpnDetected || details.isProxyDetected) {
      riskLevel = 'medium';
      risks.push(details.isVpnDetected ? 'VPN detected' : 'Proxy detected');
    }
    
    if (details.isRestrictedCountry) {
      if (riskLevel === 'low') riskLevel = 'medium';
      risks.push('High-risk country');
    }
    
    if (details.isHostingProvider) {
      if (riskLevel === 'low') riskLevel = 'medium';
      risks.push('Hosting provider IP');
    }
    
    return {
      allowed: true,
      reason: risks.length > 0 ? risks.join(', ') : undefined,
      riskLevel,
      details
    };
  }
  
  /**
   * Check if country is in high-risk list
   */
  private isRestrictedCountry(countryCode?: string): boolean {
    if (!countryCode) return false;
    return this.HIGH_RISK_COUNTRIES.has(countryCode.toUpperCase());
  }
  
  /**
   * Fetch geolocation data (mock implementation)
   */
  private async fetchGeolocationData(ip: string): Promise<GeolocationData | null> {
    // In production, this would call an API like:
    // - ipapi.co
    // - ipgeolocation.io
    // - MaxMind GeoIP2
    // - IPinfo.io
    
    // For development, return mock data based on IP patterns
    if (process.env.NODE_ENV === 'development') {
      return this.getMockGeolocationData(ip);
    }
    
    // Example API call (would need API key)
    /*
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'HealthcareAlertSystem/1.0',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geolocation API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      ip: data.ip,
      country: data.country_name,
      countryCode: data.country_code,
      region: data.region,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      isp: data.org,
      // These would come from a more advanced API
      isVpn: false,
      isProxy: false,
      isTor: false,
      isHosting: false,
    };
    */
    
    return null;
  }
  
  /**
   * Get mock geolocation data for development
   */
  private getMockGeolocationData(ip: string): GeolocationData {
    // Local IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return {
        ip,
        country: 'Local',
        countryCode: 'LO',
        city: 'Localhost',
        latitude: 0,
        longitude: 0,
        isVpn: false,
        isProxy: false,
        isTor: false,
        isHosting: false,
      };
    }
    
    // Private network IPs
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return {
        ip,
        country: 'Private Network',
        countryCode: 'PN',
        city: 'LAN',
        latitude: 0,
        longitude: 0,
        isVpn: false,
        isProxy: false,
        isTor: false,
        isHosting: false,
      };
    }
    
    // Default mock data for other IPs
    return {
      ip,
      country: 'United States',
      countryCode: 'US',
      region: 'California',
      city: 'San Francisco',
      latitude: 37.7749,
      longitude: -122.4194,
      timezone: 'America/Los_Angeles',
      isp: 'Mock ISP',
      isVpn: false,
      isProxy: false,
      isTor: false,
      isHosting: false,
    };
  }
  
  /**
   * Calculate distance between two IPs based on their geolocation
   */
  async calculateDistance(ip1: string, ip2: string): Promise<number | null> {
    const [geo1, geo2] = await Promise.all([
      this.getGeolocation(ip1),
      this.getGeolocation(ip2)
    ]);
    
    if (!geo1?.latitude || !geo1?.longitude || !geo2?.latitude || !geo2?.longitude) {
      return null;
    }
    
    return this.haversineDistance(
      geo1.latitude,
      geo1.longitude,
      geo2.latitude,
      geo2.longitude
    );
  }
  
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
   * Clear the geolocation cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const geolocationService = new GeolocationService();
export type { GeolocationData, GeolocationSecurityCheck };