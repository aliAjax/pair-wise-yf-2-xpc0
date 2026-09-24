import { useEffect, useState } from 'react';
import {
  Users,
  Clock,
  Flag,
  LogIn,
  XCircle,
  CalendarClock,
  CircleCheck,
  History,
} from 'lucide-react';
import type { OccupancyRecord } from '@/types';
import { OCCUPANCY_STATUS_LABELS, RELEASE_REASON_LABELS } from '@/types';
import { useOccupancyStore } from '@/store/useOccupancyStore';
import { useMeetupClock } from '@/hooks/useMeetupClock';
import {
  getBenchMeetupStatus,
  formatRange,
  formatDateTime,
  defaultStartInput,
} from '@/utils/meetup';

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

interface MeetupPanelProps {
  benchId: string;
  seatCount: number;
}

export default function MeetupPanel({ benchId, seatCount }: MeetupPanelProps) {
  useMeetupClock();
  const { records, initialize, register, checkIn, release, getRecordsForBench } =
    useOccupancyStore();
  const now = Date.now();

  const [teamName, setTeamName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [startTime, setStartTime] = useState(() => defaultStartInput());
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const { available, active } = getBenchMeetupStatus(benchId, records, now);
  const history = getRecordsForBench(benchId).filter((r) => r.status === 'finished');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = register(benchId, seatCount, {
      teamName,
      leaderName,
      partySize,
      startTime,
      durationMinutes,
    });
    if (!result.ok) {
      setError(result.message ?? '登记失败，请检查填写内容');
      return;
    }
    setTeamName('');
    setLeaderName('');
    setPartySize(2);
    setStartTime(defaultStartInput());
    setDurationMinutes(30);
  };

  const inputClass =
    'w-full px-3 py-2 bg-white/60 border border-deep-brown/10 rounded-lg text-sm text-deep-brown placeholder:text-ink-light/60 focus:bg-white transition-colors';

  return (
    <div className="paper-texture rounded-xl shadow-paper p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-semibold text-deep-brown">会合点</h2>
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            available ? 'bg-moss-green/10 text-moss-green' : 'bg-red-500/10 text-red-500'
          }`}
        >
          <CircleCheck className="w-3 h-3" />
          {available ? '可会合' : '已有队伍'}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-ink-light mb-4">
        <Users className="w-4 h-4 text-moss-green" />
        <span>
          {seatCount} 个座位{!available && active ? ` · 现被 ${active.partySize} 人队伍占用` : ''}
        </span>
      </div>

      {active ? (
        <ActiveRecord
          record={active}
          onCheckIn={() => checkIn(active.id)}
          onFinish={() => release(active.id, 'finished')}
          onCancel={() => release(active.id, 'cancelled')}
        />
      ) : (
        <form onSubmit={handleRegister} className="space-y-3">
          <p className="text-xs text-ink-light">
            领队填写集合信息，座位够且时段无其他队伍时登记成功。
          </p>
          <div>
            <label className="block text-xs text-ink-light mb-1">队伍名称</label>
            <input
              className={inputClass}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="例如：周末散步群"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink-light mb-1">领队</label>
              <input
                className={inputClass}
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                placeholder="领队称呼"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-light mb-1">人数</label>
              <input
                type="number"
                min={1}
                max={seatCount}
                className={inputClass}
                value={partySize}
                onChange={(e) => setPartySize(parseInt(e.target.value, 10) || 1)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink-light mb-1">集合时刻</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-ink-light mb-1">预计借坐</label>
              <select
                className={`${inputClass} cursor-pointer`}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              >
                {DURATION_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m} 分钟
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200/60 rounded-lg text-xs text-red-600 leading-relaxed">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-moss-green text-white rounded-lg text-sm font-medium hover:bg-moss-light transition-colors shadow-sm"
          >
            登记会合
          </button>
        </form>
      )}

      {history.length > 0 && (
        <div className="mt-5 pt-4 border-t border-deep-brown/10">
          <div className="flex items-center gap-1.5 mb-3 text-xs font-medium text-ink-light">
            <History className="w-3.5 h-3.5" />
            占用记录
          </div>
          <ul className="space-y-2">
            {history.slice(0, 5).map((r) => (
              <li key={r.id} className="text-xs text-ink-light leading-relaxed">
                <span className="font-medium text-deep-brown">{r.teamName}</span>
                <span className="mx-1">·</span>
                {r.partySize} 人 · {formatRange(r)}
                {r.releaseReason && (
                  <span className="ml-1 text-ink-light/70">
                    （{RELEASE_REASON_LABELS[r.releaseReason]}
                    {r.releasedAt ? ` · ${formatDateTime(r.releasedAt)}` : ''}）
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ActiveRecord({
  record,
  onCheckIn,
  onFinish,
  onCancel,
}: {
  record: OccupancyRecord;
  onCheckIn: () => void;
  onFinish: () => void;
  onCancel: () => void;
}) {
  const isWaiting = record.status === 'waiting';
  return (
    <div className={`rounded-lg p-4 ${isWaiting ? 'bg-ochre/10' : 'bg-moss-green/10'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Flag className={`w-4 h-4 ${isWaiting ? 'text-ochre' : 'text-moss-green'}`} />
        <span className="font-serif font-semibold text-deep-brown text-sm">
          {record.teamName}
        </span>
        <span
          className={`ml-auto px-2 py-0.5 rounded-full text-xs ${
            isWaiting ? 'bg-ochre/20 text-ochre' : 'bg-moss-green/20 text-moss-green'
          }`}
        >
          {OCCUPANCY_STATUS_LABELS[record.status]}
        </span>
      </div>

      <div className="space-y-1.5 text-xs text-ink-light mb-4">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span>
            {record.partySize} 人 · 领队 {record.leaderName}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" />
          <span>{formatRange(record)}</span>
        </div>
        {record.checkedInAt && (
          <div className="flex items-center gap-1.5">
            <LogIn className="w-3.5 h-3.5" />
            <span>{formatDateTime(record.checkedInAt)} 已签到</span>
          </div>
        )}
        {isWaiting && (
          <p className="text-[11px] text-ochre pt-1">
            集合时刻起 15 分钟内未签到，时段将自动释放给其他队伍。
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {isWaiting ? (
          <button
            onClick={onCheckIn}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-moss-green hover:bg-moss-light rounded-lg transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            确认签到
          </button>
        ) : (
          <button
            onClick={onFinish}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-ochre hover:bg-ochre-light rounded-lg transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            队伍散场
          </button>
        )}
        <button
          onClick={onCancel}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <XCircle className="w-3.5 h-3.5" />
          取消
        </button>
      </div>
    </div>
  );
}
