import { MEETING_GRACE_MINUTES } from '@/types';
import type { Meeting, MeetingInput, MeetingStatusType } from '@/types';

/** 借坐结束时刻 = 集合时刻 + 预计时长 */
export function getMeetingEnd(meeting: Meeting): number {
  return new Date(meeting.meetAt).getTime() + meeting.durationMinutes * 60_000;
}

/** 该记录当前是否仍占着座位（已签到的会一直占到散场，不按到点释放） */
export function isOccupying(meeting: Meeting, now: number = Date.now()): boolean {
  if (meeting.status === 'checkedIn') return true;
  if (meeting.status !== 'booked') return false;
  // 待签到：超过宽限时间仍未签到即视为未到，时段应被释放
  const graceEnd = new Date(meeting.meetAt).getTime() + MEETING_GRACE_MINUTES * 60_000;
  return now < graceEnd;
}

/**
 * 到点未签到的记录自动转为 noShow；
 * 已签到但预计借坐时间已过的，转为 ended。
 * 返回需要落盘的状态变更（不直接修改原对象）。
 */
export function getAutoStatus(meeting: Meeting, now: number = Date.now()): MeetingStatusType | null {
  if (meeting.status === 'booked') {
    const graceEnd = new Date(meeting.meetAt).getTime() + MEETING_GRACE_MINUTES * 60_000;
    if (now >= graceEnd) return 'noShow';
  }
  if (meeting.status === 'checkedIn' && now >= getMeetingEnd(meeting)) {
    return 'ended';
  }
  return null;
}

/** 两个占用时段是否重叠（首尾相接不算冲突） */
export function isTimeOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && startB < endA;
}

/** 找出该长椅与候选时段冲突的占用记录 */
export function findConflictingMeeting(
  meetings: Meeting[],
  benchId: string,
  input: MeetingInput,
  now: number = Date.now(),
  excludeId?: string,
): Meeting | undefined {
  const start = new Date(input.meetAt).getTime();
  const end = start + input.durationMinutes * 60_000;

  return meetings.find((meeting) => {
    if (meeting.benchId !== benchId || meeting.id === excludeId) return false;
    if (!isOccupying(meeting, now)) return false;
    const otherStart = new Date(meeting.meetAt).getTime();
    return isTimeOverlap(start, end, otherStart, getMeetingEnd(meeting));
  });
}

/** 这张长椅当前/接下来最该展示的一条队伍占用记录，没有则可会合 */
export function getCurrentMeeting(
  meetings: Meeting[],
  benchId: string,
  now: number = Date.now(),
): Meeting | undefined {
  return meetings
    .filter((m) => m.benchId === benchId && isOccupying(m, now))
    .sort((a, b) => new Date(a.meetAt).getTime() - new Date(b.meetAt).getTime())[0];
}

/** 该长椅的历史记录（已散场/取消/未签到），按更新时间倒序 */
export function getMeetingHistory(meetings: Meeting[], benchId: string): Meeting[] {
  return meetings
    .filter(
      (m) =>
        m.benchId === benchId &&
        (m.status === 'ended' || m.status === 'cancelled' || m.status === 'noShow'),
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/** HH:mm */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** MM月dd日 HH:mm */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 时长转中文，如 45 -> 45分钟，60 -> 1小时，90 -> 1小时30分钟 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}小时` : `${hours}小时${rest}分钟`;
}

/** datetime-local 输入框需要的本地格式：YYYY-MM-DDTHH:mm */
export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
