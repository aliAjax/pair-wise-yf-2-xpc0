import { create } from 'zustand';
import type { OccupancyRecord, ReleaseReason } from '@/types';
import { loadOccupancies, saveOccupancies } from '@/utils/storage';
import { generateId } from '@/utils/comfort';
import {
  validateRegistration,
  getExpiredReleases,
  localInputToISO,
  type RegisterInput,
  type RegisterResult,
} from '@/utils/meetup';

interface OccupancyState {
  records: OccupancyRecord[];
  initialized: boolean;
}

interface OccupancyActions {
  initialize: () => void;
  /** 登记会合：座位够且时段不冲突才成功，冲突时 result.ok 为 false 并附原因 */
  register: (benchId: string, seatCount: number, input: RegisterInput) => RegisterResult;
  /** 领队确认签到 */
  checkIn: (id: string) => void;
  /** 释放时段：散场 / 取消 */
  release: (id: string, reason: Extract<ReleaseReason, 'finished' | 'cancelled'>) => void;
  /** 自动释放所有到点未签到 / 已超时的记录 */
  sweepExpired: () => void;
  getRecordsForBench: (benchId: string) => OccupancyRecord[];
  /** 删除长椅档案时清掉它的占用记录，避免悬挂数据 */
  removeForBench: (benchId: string) => void;
}

export const useOccupancyStore = create<OccupancyState & OccupancyActions>((set, get) => ({
  records: [],
  initialized: false,

  initialize: () => {
    if (get().initialized) return;
    set({ records: loadOccupancies(), initialized: true });
    get().sweepExpired();
  },

  register: (benchId, seatCount, input) => {
    const now = Date.now();
    const normalized: RegisterInput = {
      ...input,
      teamName: input.teamName.trim(),
      leaderName: input.leaderName.trim(),
      startTime: input.startTime,
    };

    const benchRecords = get().records.filter((r) => r.benchId === benchId);
    const result = validateRegistration(normalized, seatCount, benchRecords, now);
    if (!result.ok) return result;

    const record: OccupancyRecord = {
      id: generateId(),
      benchId,
      teamName: normalized.teamName,
      leaderName: normalized.leaderName,
      startTime: localInputToISO(normalized.startTime),
      durationMinutes: normalized.durationMinutes,
      partySize: normalized.partySize,
      status: 'waiting',
      createdAt: new Date(now).toISOString(),
      checkedInAt: null,
      releasedAt: null,
      releaseReason: null,
    };
    const records = [record, ...get().records];
    set({ records });
    saveOccupancies(records);
    return { ok: true };
  },

  checkIn: (id) => {
    const records = get().records.map((r) =>
      r.id === id && r.status === 'waiting'
        ? { ...r, status: 'checked_in' as const, checkedInAt: new Date().toISOString() }
        : r,
    );
    set({ records });
    saveOccupancies(records);
  },

  release: (id, reason) => {
    const records = get().records.map((r) =>
      r.id === id && r.status !== 'finished'
        ? {
            ...r,
            status: 'finished' as const,
            releasedAt: new Date().toISOString(),
            releaseReason: reason,
          }
        : r,
    );
    set({ records });
    saveOccupancies(records);
  },

  sweepExpired: () => {
    const expired = getExpiredReleases(get().records);
    if (expired.length === 0) return;
    const byId = new Map(expired.map((e) => [e.id, e.reason]));
    const now = new Date().toISOString();
    const records = get().records.map((r) => {
      const reason = byId.get(r.id);
      if (!reason) return r;
      return {
        ...r,
        status: 'finished' as const,
        releasedAt: now,
        releaseReason: reason satisfies ReleaseReason,
      };
    });
    set({ records });
    saveOccupancies(records);
  },

  getRecordsForBench: (benchId) =>
    get()
      .records.filter((r) => r.benchId === benchId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),

  removeForBench: (benchId) => {
    const records = get().records.filter((r) => r.benchId !== benchId);
    if (records.length === get().records.length) return;
    set({ records });
    saveOccupancies(records);
  },
}));
