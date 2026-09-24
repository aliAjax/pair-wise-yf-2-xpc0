import { useEffect } from 'react';
import { useBenchStore } from '@/store/useBenchStore';

/** 定时把到点未签到 / 借坐已结束的占用记录释放掉（每 30 秒检查一次） */
export function useMeetingSync() {
  const initialize = useBenchStore((s) => s.initialize);
  const initialized = useBenchStore((s) => s.initialized);
  const syncMeetings = useBenchStore((s) => s.syncMeetings);

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  useEffect(() => {
    const timer = window.setInterval(() => syncMeetings(), 30_000);
    return () => window.clearInterval(timer);
  }, [syncMeetings]);
}
