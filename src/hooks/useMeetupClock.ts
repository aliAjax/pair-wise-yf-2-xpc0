import { useEffect } from 'react';
import { useOccupancyStore } from '@/store/useOccupancyStore';

/**
 * 初始化占用记录存档并定时扫描：
 * 到点未签到 / 借坐到点的记录会被自动释放（store 更新后页面自动重渲染）。
 * 每个页面挂一个实例即可，不接后台，纯本地存档。
 */
export function useMeetupClock(intervalMs = 30_000): void {
  const initialize = useOccupancyStore((s) => s.initialize);
  const sweepExpired = useOccupancyStore((s) => s.sweepExpired);

  useEffect(() => {
    initialize();
    sweepExpired();
    const timer = window.setInterval(() => {
      sweepExpired();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [initialize, sweepExpired, intervalMs]);
}
