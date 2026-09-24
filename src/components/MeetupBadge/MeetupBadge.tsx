import { CircleCheck, Flag } from 'lucide-react';
import type { Bench } from '@/types';
import { useOccupancyStore } from '@/store/useOccupancyStore';
import { getBenchMeetupStatus } from '@/utils/meetup';

interface MeetupBadgeProps {
  bench: Bench;
  className?: string;
}

/** 会合状态徽标：列表卡片与地图共用同一推导逻辑（过期释放由页面扫描触发重渲染） */
export default function MeetupBadge({ bench, className = '' }: MeetupBadgeProps) {
  const records = useOccupancyStore((s) => s.records);
  const { available } = getBenchMeetupStatus(bench.id, records);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        available ? 'bg-moss-green/10 text-moss-green' : 'bg-red-500/10 text-red-500'
      } ${className}`}
    >
      {available ? (
        <CircleCheck className="w-3 h-3" />
      ) : (
        <Flag className="w-3 h-3" />
      )}
      {available ? '可会合' : '已有队伍'}
    </span>
  );
}
