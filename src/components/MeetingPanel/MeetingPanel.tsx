import { useMemo, useState } from 'react';
import {
  Users,
  Clock,
  Flag,
  CircleCheck,
  XCircle,
  LogOut,
  CalendarClock,
  User,
  History,
  TriangleAlert,
} from 'lucide-react';
import type { Bench, Meeting, MeetingStatusType } from '@/types';
import { MEETING_STATUS_LABELS, MEETING_DURATION_OPTIONS, MEETING_GRACE_MINUTES } from '@/types';
import { useBenchStore } from '@/store/useBenchStore';
import {
  getCurrentMeeting,
  getMeetingHistory,
  formatDateTime,
  formatDuration,
  toLocalInputValue,
} from '@/utils/meeting';

interface MeetingPanelProps {
  bench: Bench;
}

const STATUS_STYLES: Record<MeetingStatusType, string> = {
  booked: 'bg-ochre/10 text-ochre',
  checkedIn: 'bg-moss-green/10 text-moss-green',
  ended: 'bg-ink-light/10 text-ink-light',
  cancelled: 'bg-ink-light/10 text-ink-light',
  noShow: 'bg-red-100 text-red-500',
};

export default function MeetingPanel({ bench }: MeetingPanelProps) {
  const meetings = useBenchStore((s) => s.meetings);
  const registerMeeting = useBenchStore((s) => s.registerMeeting);
  const checkInMeeting = useBenchStore((s) => s.checkInMeeting);
  const cancelMeeting = useBenchStore((s) => s.cancelMeeting);
  const endMeeting = useBenchStore((s) => s.endMeeting);

  const [teamName, setTeamName] = useState('周末散步队');
  const [leaderName, setLeaderName] = useState('');
  const [meetAt, setMeetAt] = useState(() => {
    const d = new Date(Date.now() + 60 * 60_000);
    d.setMinutes(0, 0, 0);
    return toLocalInputValue(d);
  });
  const [peopleCount, setPeopleCount] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [error, setError] = useState('');
  const [justRegistered, setJustRegistered] = useState(false);

  const activeMeeting = useMemo(
    () => getCurrentMeeting(meetings, bench.id),
    [meetings, bench.id],
  );
  const history = useMemo(
    () => getMeetingHistory(meetings, bench.id).slice(0, 3),
    [meetings, bench.id],
  );

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = registerMeeting(bench.id, {
      teamName,
      leaderName,
      meetAt,
      peopleCount,
      durationMinutes,
    });
    if (result.success === true) {
      setJustRegistered(true);
      setLeaderName('');
    } else {
      const failed = result as { success: false; reason: string };
      setError(failed.reason);
    }
  };

  return (
    <div className="paper-texture rounded-xl shadow-paper p-6 fade-in opacity-0 stagger-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-semibold text-deep-brown">
          会合登记
        </h2>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-moss-green/10 text-moss-green text-xs rounded-md">
          <Users className="w-3 h-3" />
          {bench.seatCount} 个座位
        </span>
      </div>

      {activeMeeting ? (
        <div className="space-y-4">
          <div className="p-4 bg-ochre/5 rounded-lg border border-ochre/20">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[activeMeeting.status]}`}>
                {MEETING_STATUS_LABELS[activeMeeting.status]}
              </span>
              <span className="text-xs text-ink-light">
                占用 {activeMeeting.peopleCount}/{bench.seatCount} 座
              </span>
            </div>
            <h3 className="font-serif font-medium text-deep-brown mb-2">
              {activeMeeting.teamName}
            </h3>
            <div className="space-y-1.5 text-sm text-ink-light">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span>领队：{activeMeeting.leaderName || '未署名'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>集合：{formatDateTime(activeMeeting.meetAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>预计借坐 {formatDuration(activeMeeting.durationMinutes)}</span>
              </div>
            </div>

            {activeMeeting.status === 'booked' && (
              <p className="mt-3 text-xs text-ochre bg-ochre/10 rounded-md px-2.5 py-1.5">
                超过集合时刻 {MEETING_GRACE_MINUTES} 分钟仍未签到，时段将自动释放
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {activeMeeting.status === 'booked' && (
                <button
                  onClick={() => checkInMeeting(activeMeeting.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-moss-green hover:bg-moss-light rounded-lg transition-colors"
                >
                  <CircleCheck className="w-4 h-4" />
                  签到
                </button>
              )}
              <button
                onClick={() => endMeeting(activeMeeting.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-deep-brown bg-warm-beige hover:bg-warm-beige/80 rounded-lg transition-colors"
              >
                <Flag className="w-4 h-4" />
                {activeMeeting.status === 'checkedIn' ? '散场释放' : '提前结束'}
              </button>
              {activeMeeting.status === 'booked' && (
                <button
                  onClick={() => cancelMeeting(activeMeeting.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  取消登记
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-ink-light/70 flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" />
            队伍散场、取消登记或到点未签到后，此时段会自动释放，其他队伍可重新登记
          </p>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-moss-green/5 rounded-lg text-sm text-moss-green">
            <CircleCheck className="w-4 h-4 flex-shrink-0" />
            <span>当前可会合，{bench.seatCount} 个座位均可登记</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink-light mb-1">队伍名称</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="周末散步队"
                className="w-full px-3 py-2 text-sm bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown placeholder:text-ink-light/60 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-light mb-1">领队</label>
              <input
                type="text"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                placeholder="领队称呼（选填）"
                className="w-full px-3 py-2 text-sm bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown placeholder:text-ink-light/60 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-ink-light mb-1">集合时刻</label>
            <input
              type="datetime-local"
              value={meetAt}
              onChange={(e) => setMeetAt(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown focus:bg-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink-light mb-1">
                人数（最多 {bench.seatCount} 人）
              </label>
              <input
                type="number"
                min={1}
                max={bench.seatCount}
                value={peopleCount}
                onChange={(e) => setPeopleCount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-sm bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-light mb-1">预计借坐</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-sm bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown focus:bg-white cursor-pointer"
              >
                {MEETING_DURATION_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {formatDuration(minutes)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>登记失败：{error}</span>
            </div>
          )}
          {justRegistered && !error && (
            <div className="px-3 py-2 bg-moss-green/10 rounded-lg text-sm text-moss-green">
              登记成功！已为队伍保留该时段，请按时签到。
            </div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-ochre text-white rounded-lg font-medium text-sm hover:bg-ochre-light transition-colors shadow-md hover:shadow-lg"
          >
            登记会合
          </button>
          <p className="text-xs text-ink-light/70 text-center">
            座位够且时段没有别的队伍占用时才能登记成功
          </p>
        </form>
      )}

      {history.length > 0 && (
        <div className="mt-5 pt-4 border-t border-deep-brown/10">
          <h3 className="flex items-center gap-1.5 text-xs font-medium text-ink-light mb-2">
            <History className="w-3.5 h-3.5" />
            最近记录
          </h3>
          <ul className="space-y-1.5">
            {history.map((record: Meeting) => (
              <li key={record.id} className="flex items-center justify-between text-xs text-ink-light">
                <span className="truncate">
                  {record.teamName} · {formatDateTime(record.meetAt)}
                </span>
                <span className={`ml-2 px-1.5 py-0.5 rounded ${STATUS_STYLES[record.status]}`}>
                  {MEETING_STATUS_LABELS[record.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
