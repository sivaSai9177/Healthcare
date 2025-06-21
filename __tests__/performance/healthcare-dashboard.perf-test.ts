import { performance } from 'perf_hooks';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (!start) throw new Error(`Start mark '${startMark}' not found`);
    
    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (endMark && !end) throw new Error(`End mark '${endMark}' not found`);
    
    const duration = (end || performance.now()) - start;
    
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });
    
    return duration;
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, number[]> = {};
    
    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = [];
      }
      summary[metric.name].push(metric.duration);
    });
    
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    Object.entries(summary).forEach(([name, durations]) => {
      result[name] = {
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        count: durations.length,
      };
    });
    
    return result;
  }

  reset(): void {
    this.metrics = [];
    this.marks.clear();
  }
}

describe('Healthcare Dashboard Performance', () => {
  const monitor = new PerformanceMonitor();

  beforeEach(() => {
    monitor.reset();
  });

  describe('Dashboard Load Performance', () => {
    it('should load dashboard within acceptable time', async () => {
      monitor.mark('dashboard-start');
      
      // Simulate component mounting
      await simulateDashboardMount();
      
      monitor.mark('dashboard-mounted');
      
      // Simulate data fetching
      await simulateDataFetch();
      
      monitor.mark('data-loaded');
      
      // Simulate rendering
      await simulateRendering();
      
      monitor.mark('render-complete');
      
      // Measure different phases
      const mountTime = monitor.measure('mount-time', 'dashboard-start', 'dashboard-mounted');
      const fetchTime = monitor.measure('fetch-time', 'dashboard-mounted', 'data-loaded');
      const renderTime = monitor.measure('render-time', 'data-loaded', 'render-complete');
      const totalTime = monitor.measure('total-time', 'dashboard-start', 'render-complete');
      
      // Performance assertions
      expect(mountTime).toBeLessThan(100); // Mount should be fast
      expect(fetchTime).toBeLessThan(1000); // Data fetch under 1s
      expect(renderTime).toBeLessThan(200); // Render under 200ms
      expect(totalTime).toBeLessThan(1500); // Total under 1.5s
    });

    it('should handle large datasets efficiently', async () => {
      const alertCounts = [100, 500, 1000, 5000];
      const results: Record<number, number> = {};
      
      for (const count of alertCounts) {
        monitor.mark(`load-${count}-start`);
        
        await simulateLoadingAlerts(count);
        
        monitor.mark(`load-${count}-end`);
        
        const duration = monitor.measure(
          `load-${count}-alerts`,
          `load-${count}-start`,
          `load-${count}-end`
        );
        
        results[count] = duration;
      }
      
      // Performance should scale linearly or better
      const scalingFactor = results[1000] / results[100];
      expect(scalingFactor).toBeLessThan(15); // Should not be 10x slower for 10x data
      
      // Even with 5000 alerts, should remain responsive
      expect(results[5000]).toBeLessThan(3000);
    });
  });

  describe('Real-time Update Performance', () => {
    it('should handle WebSocket messages efficiently', async () => {
      const messageCount = 100;
      const processingTimes: number[] = [];
      
      for (let i = 0; i < messageCount; i++) {
        monitor.mark(`msg-${i}-start`);
        
        await simulateWebSocketMessage({
          type: 'alert-update',
          alertId: `alert-${i}`,
          data: { status: 'acknowledged' },
        });
        
        monitor.mark(`msg-${i}-end`);
        
        const time = monitor.measure(
          `process-message`,
          `msg-${i}-start`,
          `msg-${i}-end`
        );
        
        processingTimes.push(time);
      }
      
      const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
      const maxProcessingTime = Math.max(...processingTimes);
      
      expect(avgProcessingTime).toBeLessThan(10); // Avg under 10ms
      expect(maxProcessingTime).toBeLessThan(50); // Max under 50ms
    });

    it('should batch updates efficiently', async () => {
      monitor.mark('batch-start');
      
      // Simulate receiving multiple updates at once
      const updates = Array.from({ length: 50 }, (_, i) => ({
        type: 'alert-update',
        alertId: `alert-${i}`,
        data: { status: 'acknowledged' },
      }));
      
      await simulateBatchUpdate(updates);
      
      monitor.mark('batch-end');
      
      const batchTime = monitor.measure('batch-update', 'batch-start', 'batch-end');
      
      // Batched updates should be more efficient than individual
      expect(batchTime).toBeLessThan(100); // Under 100ms for 50 updates
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with repeated updates', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        // Simulate creating and destroying alerts
        const alerts = createMockAlerts(100);
        await processAlerts(alerts);
        // Alerts should be garbage collected
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Rendering Performance', () => {
    it('should optimize re-renders', async () => {
      let renderCount = 0;
      
      const trackRender = () => {
        renderCount++;
      };
      
      // Initial render
      await simulateComponentRender(trackRender);
      expect(renderCount).toBe(1);
      
      // Update that shouldn't cause re-render
      await simulateNonVisualUpdate();
      expect(renderCount).toBe(1); // Should not re-render
      
      // Update that should cause re-render
      await simulateVisualUpdate();
      expect(renderCount).toBe(2); // Should re-render once
    });
  });
});

// Helper functions for simulation
async function simulateDashboardMount(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50));
}

async function simulateDataFetch(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 200));
}

async function simulateRendering(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 100));
}

async function simulateLoadingAlerts(count: number): Promise<void> {
  const baseTime = 100;
  const perItemTime = 0.1;
  return new Promise(resolve => setTimeout(resolve, baseTime + (count * perItemTime)));
}

async function simulateWebSocketMessage(message: any): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 2));
}

async function simulateBatchUpdate(updates: any[]): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 20));
}

function createMockAlerts(count: number): any[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `alert-${i}`,
    status: 'active',
    urgencyLevel: Math.floor(Math.random() * 5) + 1,
  }));
}

async function processAlerts(alerts: any[]): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 10));
}

async function simulateComponentRender(onRender: () => void): Promise<void> {
  onRender();
  return new Promise(resolve => setTimeout(resolve, 10));
}

async function simulateNonVisualUpdate(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 5));
}

async function simulateVisualUpdate(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 5));
}