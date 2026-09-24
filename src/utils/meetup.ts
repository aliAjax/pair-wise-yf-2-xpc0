import type { BenchMeetupStatus, OccupancyRecord } from '@/types';

/** 登记入参：领队填写的集合信息 */
export interface RegisterInput {
  teamName: string;
  leaderName: string;
  startTime: string;
  durationMinutes: number;
  partySize: number;
}

export type RegisterErrorCode =
  | 'missing_fields'
  | 'invalid_party_size'
  | 'party_exceeds_seats'
  | 'past_start_time'
  | 'time_conflict';

export interface RegisterResult {
  ok: boolean;
  errorCode?: RegisterErrorCode;
  /** 冲突时给出可读原因 */
  message?: string;
}

/** 待签到宽限分钟数：集合时刻过后超过该时长仍未签到，自动释放 */
export const CHECKIN_GRACE_MINUTES = 15;

export function getEndTime(record: Pick<OccupancyRecord, 'startTime' | 'durationMinutes'>): number {
  return new Date(record.startTime).getTime() + record.durationMinutes * 60_000;
}

/** 记录此刻是否仍占用时段（waiting 过点未签到宽限期内仍算占用，给领队留签到时间） */
export function isActiveAt(record: OccupancyRecord, now: number): boolean {
  if (record.status === 'finished') return false;
  const start = new Date(record.startTime).getTime();
  if (record.status === 'waiting') {
    return now < start + CHECKIN_GRACE_MINUTES * 60_000;
  }
  // checked_in：到预计借坐结束时刻散场
  return now < getEndTime(record);
}

function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && startB < endA;
}

function formatTimeRange(start: number, end: number): string {
  const fmt = (t: number) =>
    new Date(t).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  return `${fmt(start)} 至 ${fmt(end)}`;
}

/**
 * 校验会合登记：座位够、且该时段没有别的队伍占用才成功。
 * 冲突时返回具体原因。
 */
export function validateRegistration(
  input: RegisterInput,
  seatCount: number,
  records: OccupancyRecord[],
  now: number = Date.now(),
): RegisterResult {
  if (
    !input.teamName.trim() ||
    !input.leaderName.trim() ||
    !input.startTime ||
    !input.durationMinutes
  ) {
    return { ok: false, errorCode: 'missing_fields', message: '请填写队伍、领队、集合时刻和借坐时长' };
  }

  if (!Number.isFinite(input.partySize) || input.partySize < 1) {
    return { ok: false, errorCode: 'invalid_party_size', message: '人数至少为 1 人' };
  }

  if (input.partySize > seatCount) {
    return {
      ok: false,
      errorCode: 'party_exceeds_seats',
      message: `座位不够：这张长椅只有 ${seatCount} 个座位，坐不下 ${input.partySize} 人`,
    };
  }

  const start = new Date(input.startTime).getTime();
  if (Number.isNaN(start)) {
    return { ok: false, errorCode: 'missing_fields', message: '集合时刻格式不正确' };
  }
  if (start < now) {
    return { ok: false, errorCode: 'past_start_time', message: '集合时刻已过，请选择将来的时间' };
  }
  const end = start + input.durationMinutes * 60_000;

  const blocker = records
    .filter((r) => r.status !== 'finished' && isActiveAt(r, now))
    .find((r) => {
      const rStart = new Date(r.startTime).getTime();
      const rEnd = getEndTime(r);
      return intervalsOverlap(start, end, rStart, rEnd);
    });

  if (blocker) {
    return {
      ok: false,
      errorCode: 'time_conflict',
      message: `时段冲突：「${blocker.teamName}」已登记 ${formatTimeRange(
        new Date(blocker.startTime).getTime(),
        getEndTime(blocker),
      )}，请换个时间或另一张长椅`,
    };
  }

  return { ok: true };
}

/** 取一张长椅当前有效的占用记录（列表卡片与地图共用同一推导结果） */
export function getBenchMeetupStatus(
  benchId: string,
  records: OccupancyRecord[],
  now: number = Date.now(),
): BenchMeetupStatus {
  const active = records.find(
    (r) => r.benchId === benchId && r.status !== 'finished' && isActiveAt(r, now),
  ) ?? null;
  return { available: !active, active };
}

/**
 * 扫描过期记录并返回需要自动释放的记录：
 * - waiting 且超过集合时刻 + 宽限期 → no_show（到点未签到）
 * - checked_in 且超过预计结束时刻 → finished（到点散场）
 */
export function getExpiredReleases(
  records: OccupancyRecord[],
  now: number = Date.now(),
): Array<{ id: string; reason: 'no_show' | 'finished' }> {
  return records
    .filter((r) => r.status !== 'finished' && !isActiveAt(r, now))
    .map((r) => ({
      id: r.id,
      reason: r.status === 'waiting' ? 'no_show' as const : 'finished' as const,
    }));
}

/** 将 datetime-local 的值（本地时区）转为 ISO 字符串 */
export function localInputToISO(value: string): string {
  return new Date(value).toISOString();
}

/** ISO 转为 datetime-local 输入框需要的本地格式 */
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatRange(record: OccupancyRecord): string {
  return `${formatDateTime(record.startTime)} 起 · ${record.durationMinutes} 分钟`;
}

/** 当前时间向最近的整 5 分钟取整，作为表单默认值 */
export function defaultStartInput(now: number = Date.now()): string {
  const d = new Date(Math.ceil(now / (5 * 60_000)) * 5 * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
