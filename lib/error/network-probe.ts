import { logger } from '@/lib/core/debug/unified-logger';

// Network probe configuration
const PROBE_ENDPOINTS = [
  // Primary endpoints
  { url: 'https://www.google.com/generate_204', timeout: 5000 },
  { url: 'https://cloudflare.com/cdn-cgi/trace', timeout: 5000 },
  // Fallback endpoints
  { url: 'https://api.github.com/zen', timeout: 8000 },
  { url: 'https://httpbin.org/status/200', timeout: 8000 },
];

export interface NetworkProbeResult {
  isOnline: boolean;
  latency?: number;
  endpoint?: string;
  error?: Error;
}

class NetworkProbeManager {
  private static instance: NetworkProbeManager;
  private probeController: AbortController | null = null;
  private isProbing = false;
  private lastProbeTime = 0;
  private lastResult: NetworkProbeResult | null = null;
  private readonly PROBE_CACHE_DURATION = 10000; // 10 seconds

  static getInstance(): NetworkProbeManager {
    if (!NetworkProbeManager.instance) {
      NetworkProbeManager.instance = new NetworkProbeManager();
    }
    return NetworkProbeManager.instance;
  }

  async checkConnectivity(): Promise<NetworkProbeResult> {
    // Return cached result if recent
    const now = Date.now();
    if (this.lastResult && (now - this.lastProbeTime) < this.PROBE_CACHE_DURATION) {
      return this.lastResult;
    }

    // Prevent concurrent probes
    if (this.isProbing) {
      return this.lastResult || { isOnline: true };
    }

    this.isProbing = true;
    this.probeController = new AbortController();

    try {
      // Try each endpoint in sequence
      for (const endpoint of PROBE_ENDPOINTS) {
        const result = await this.probeEndpoint(endpoint);
        if (result.isOnline) {
          this.lastResult = result;
          this.lastProbeTime = now;
          return result;
        }
      }

      // All endpoints failed
      const offlineResult: NetworkProbeResult = {
        isOnline: false,
        error: new Error('All connectivity checks failed'),
      };
      this.lastResult = offlineResult;
      this.lastProbeTime = now;
      return offlineResult;

    } finally {
      this.isProbing = false;
      this.probeController = null;
    }
  }

  private async probeEndpoint(endpoint: { url: string; timeout: number }): Promise<NetworkProbeResult> {
    const startTime = Date.now();
    
    try {
      const timeoutId = setTimeout(() => {
        this.probeController?.abort();
      }, endpoint.timeout);

      const response = await fetch(endpoint.url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: this.probeController?.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      // For no-cors requests, we can't read the status but no error means success
      logger.debug(`Network probe succeeded: ${endpoint.url} (${latency}ms)`, 'SYSTEM');
      
      return {
        isOnline: true,
        latency,
        endpoint: endpoint.url,
      };

    } catch (error) {
      // Don't log abort errors from our own timeout
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.debug(`Network probe failed: ${endpoint.url}`, 'SYSTEM', error);
      }
      
      return {
        isOnline: false,
        endpoint: endpoint.url,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  cancelProbe() {
    this.probeController?.abort();
  }
}

// Export singleton instance methods
export const networkProbe = {
  check: () => NetworkProbeManager.getInstance().checkConnectivity(),
  cancel: () => NetworkProbeManager.getInstance().cancelProbe(),
};