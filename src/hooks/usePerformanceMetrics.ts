import { useEffect, useRef, useState, useCallback } from 'react';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  memory: number | null;
}

const SAMPLE_SIZE = 60;
const UPDATE_INTERVAL = 30;

export function usePerformanceMetrics(enabled: boolean = true) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    minFrameTime: 16.67,
    maxFrameTime: 16.67,
    memory: null,
  });

  const frameTimes = useRef<Float64Array>(new Float64Array(SAMPLE_SIZE));
  const ringIndex = useRef(0);
  const sampleCount = useRef(0);
  const lastFrameTime = useRef(0);
  const updateCounter = useRef(0);
  const isFirstFrame = useRef(true);

  const updateMetrics = useCallback(() => {
    if (!enabled) return;

    const now = performance.now();
    
    if (isFirstFrame.current) {
      isFirstFrame.current = false;
      lastFrameTime.current = now;
      return;
    }
    
    const frameTime = now - lastFrameTime.current;
    lastFrameTime.current = now;

    frameTimes.current[ringIndex.current] = frameTime;
    ringIndex.current = (ringIndex.current + 1) % SAMPLE_SIZE;
    if (sampleCount.current < SAMPLE_SIZE) {
      sampleCount.current++;
    }

    updateCounter.current++;
    if (updateCounter.current >= UPDATE_INTERVAL && sampleCount.current >= SAMPLE_SIZE) {
      updateCounter.current = 0;

      const times = frameTimes.current;
      let sum = 0;
      let minFrameTime = times[0];
      let maxFrameTime = times[0];
      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const t = times[i];
        sum += t;
        if (t < minFrameTime) minFrameTime = t;
        if (t > maxFrameTime) maxFrameTime = t;
      }
      const avgFrameTime = sum / SAMPLE_SIZE;

      const memoryInfo = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
      const memory = memoryInfo ? memoryInfo.usedJSHeapSize / 1048576 : null;

      setMetrics({
        fps: 1000 / avgFrameTime,
        frameTime: avgFrameTime,
        minFrameTime,
        maxFrameTime,
        memory,
      });
    }
  }, [enabled]);

  const mark = useCallback((name: string) => {
    performance.mark(`${name}-start`);
  }, []);

  const endMark = useCallback((name: string): number | null => {
    try {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      const entries = performance.getEntriesByName(name, 'measure');
      const duration = entries[entries.length - 1]?.duration ?? null;
      
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
      
      return duration;
    } catch {
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    frameTimes.current.fill(0);
    ringIndex.current = 0;
    sampleCount.current = 0;
    updateCounter.current = 0;
    lastFrameTime.current = performance.now();
  }, []);

  return { metrics, updateMetrics, mark, endMark, reset };
}

interface StatsGLOptions {
  trackGPU: boolean;
  trackHz: boolean;
  trackCPT: boolean;
  logsPerSecond: number;
  graphsPerSecond: number;
  samplesLog: number;
  samplesGraph: number;
  precision: number;
  horizontal: boolean;
  minimal: boolean;
  mode: number;
}

interface StatsGL {
  dom: HTMLDivElement;
  update: () => void;
}

export function useStatsOverlay(enabled: boolean = true) {
  const statsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let animationId: number;
    let stats: StatsGL | null = null;

    import('stats-gl').then(({ default: Stats }) => {
      const options: StatsGLOptions = {
        trackGPU: true,
        trackHz: false,
        trackCPT: false,
        logsPerSecond: 4,
        graphsPerSecond: 30,
        samplesLog: 40,
        samplesGraph: 10,
        precision: 2,
        horizontal: true,
        minimal: false,
        mode: 0,
      };

      stats = new Stats(options) as StatsGL;

      stats.dom.style.position = 'absolute';
      stats.dom.style.top = '0';
      stats.dom.style.left = '0';
      stats.dom.style.zIndex = '10000';
      document.body.appendChild(stats.dom);
      statsRef.current = stats.dom;

      const update = () => {
        stats?.update();
        animationId = requestAnimationFrame(update);
      };
      animationId = requestAnimationFrame(update);
    });

    return () => {
      cancelAnimationFrame(animationId);
      if (statsRef.current && document.body.contains(statsRef.current)) {
        document.body.removeChild(statsRef.current);
      }
    };
  }, [enabled]);
}
