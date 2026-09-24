import { create } from 'zustand';
import type { Bench, BenchExperience, MaterialType, OrientationType, ShadeLevelType, NoiseLevelType, Meeting, MeetingInput, MeetingResult } from '@/types';
import { loadBenches, saveBenches, loadMeetings, saveMeetings, normalizeBench } from '@/utils/storage';
import { generateId } from '@/utils/comfort';
import { findConflictingMeeting, getAutoStatus, formatTime, formatDuration } from '@/utils/meeting';
import { mockBenches } from '@/data/mockBenches';

interface BenchState {
  benches: Bench[];
  meetings: Meeting[];
  searchQuery: string;
  materialFilter: MaterialType | null;
  orientationFilter: OrientationType | null;
  shadeFilter: ShadeLevelType | null;
  noiseFilter: NoiseLevelType | null;
  initialized: boolean;
}

interface BenchActions {
  initialize: () => void;
  setSearchQuery: (query: string) => void;
  setMaterialFilter: (material: MaterialType | null) => void;
  setOrientationFilter: (orientation: OrientationType | null) => void;
  setShadeFilter: (shade: ShadeLevelType | null) => void;
  setNoiseFilter: (noise: NoiseLevelType | null) => void;
  clearFilters: () => void;
  addBench: (bench: Omit<Bench, 'id' | 'createdAt' | 'updatedAt' | 'experiences'>) => void;
  updateBench: (id: string, updates: Partial<Bench>) => void;
  deleteBench: (id: string) => void;
  getBenchById: (id: string) => Bench | undefined;
  addExperience: (benchId: string, experience: Omit<BenchExperience, 'id' | 'benchId'>) => void;
  updateExperience: (benchId: string, expId: string, updates: Partial<BenchExperience>) => void;
  deleteExperience: (benchId: string, expId: string) => void;
  getFilteredBenches: () => Bench[];
  getMeetingsByBench: (benchId: string) => Meeting[];
  syncMeetings: () => void;
  registerMeeting: (benchId: string, input: MeetingInput) => MeetingResult;
  checkInMeeting: (meetingId: string) => void;
  cancelMeeting: (meetingId: string) => void;
  endMeeting: (meetingId: string) => void;
}

const initialState: BenchState = {
  benches: [],
  meetings: [],
  searchQuery: '',
  materialFilter: null,
  orientationFilter: null,
  shadeFilter: null,
  noiseFilter: null,
  initialized: false,
};

export const useBenchStore = create<BenchState & BenchActions>((set, get) => ({
  ...initialState,

  initialize: () => {
    if (get().initialized) return;
    const stored = loadBenches();
    if (stored.length > 0) {
      set({ benches: stored.map(normalizeBench), meetings: loadMeetings(), initialized: true });
    } else {
      set({ benches: mockBenches, meetings: [], initialized: true });
      saveBenches(mockBenches);
    }
    get().syncMeetings();
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setMaterialFilter: (material) => set({ materialFilter: material }),
  setOrientationFilter: (orientation) => set({ orientationFilter: orientation }),
  setShadeFilter: (shade) => set({ shadeFilter: shade }),
  setNoiseFilter: (noise) => set({ noiseFilter: noise }),

  clearFilters: () => set({
    searchQuery: '',
    materialFilter: null,
    orientationFilter: null,
    shadeFilter: null,
    noiseFilter: null,
  }),

  addBench: (benchData) => {
    const now = new Date().toISOString();
    const newBench: Bench = {
      ...benchData,
      id: generateId(),
      experiences: [],
      createdAt: now,
      updatedAt: now,
    };
    const newBenches = [newBench, ...get().benches];
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  updateBench: (id, updates) => {
    const newBenches = get().benches.map((bench) =>
      bench.id === id
        ? { ...bench, ...updates, updatedAt: new Date().toISOString() }
        : bench
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  deleteBench: (id) => {
    const newBenches = get().benches.filter((bench) => bench.id !== id);
    const newMeetings = get().meetings.filter((meeting) => meeting.benchId !== id);
    set({ benches: newBenches, meetings: newMeetings });
    saveBenches(newBenches);
    saveMeetings(newMeetings);
  },

  getBenchById: (id) => {
    return get().benches.find((bench) => bench.id === id);
  },

  addExperience: (benchId, experienceData) => {
    const newExperience: BenchExperience = {
      ...experienceData,
      id: generateId(),
      benchId,
    };
    const newBenches = get().benches.map((bench) =>
      bench.id === benchId
        ? {
            ...bench,
            experiences: [...bench.experiences, newExperience],
            updatedAt: new Date().toISOString(),
          }
        : bench
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  updateExperience: (benchId, expId, updates) => {
    const newBenches = get().benches.map((bench) =>
      bench.id === benchId
        ? {
            ...bench,
            experiences: bench.experiences.map((exp) =>
              exp.id === expId ? { ...exp, ...updates } : exp
            ),
            updatedAt: new Date().toISOString(),
          }
        : bench
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  deleteExperience: (benchId, expId) => {
    const newBenches = get().benches.map((bench) =>
      bench.id === benchId
        ? {
            ...bench,
            experiences: bench.experiences.filter((exp) => exp.id !== expId),
            updatedAt: new Date().toISOString(),
          }
        : bench
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  getFilteredBenches: () => {
    const { benches, searchQuery, materialFilter, orientationFilter, shadeFilter, noiseFilter } = get();

    return benches.filter((bench) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = bench.name.toLowerCase().includes(query);
        const matchLocation = bench.location.toLowerCase().includes(query);
        const matchReview = bench.review.toLowerCase().includes(query);
        if (!matchName && !matchLocation && !matchReview) return false;
      }

      if (materialFilter && bench.material !== materialFilter) return false;
      if (orientationFilter && bench.orientation !== orientationFilter) return false;
      if (shadeFilter && bench.shadeLevel !== shadeFilter) return false;
      if (noiseFilter && bench.noiseLevel !== noiseFilter) return false;

      return true;
    });
  },

  getMeetingsByBench: (benchId) => {
    return get().meetings.filter((meeting) => meeting.benchId === benchId);
  },

  // 到点未签到自动释放、已签到且预计借坐已结束自动散场
  syncMeetings: () => {
    const now = Date.now();
    let changed = false;
    const newMeetings = get().meetings.map((meeting) => {
      const nextStatus = getAutoStatus(meeting, now);
      if (!nextStatus) return meeting;
      changed = true;
      return { ...meeting, status: nextStatus, updatedAt: new Date(now).toISOString() };
    });
    if (changed) {
      set({ meetings: newMeetings });
      saveMeetings(newMeetings);
    }
  },

  registerMeeting: (benchId, input) => {
    get().syncMeetings();
    const bench = get().benches.find((b) => b.id === benchId);
    if (!bench) {
      return { success: false, reason: '找不到这张长椅' };
    }

    const meetTime = new Date(input.meetAt).getTime();
    if (Number.isNaN(meetTime)) {
      return { success: false, reason: '请选择有效的集合时刻' };
    }
    if (meetTime < Date.now()) {
      return { success: false, reason: '集合时刻已过，请选择未来的时间' };
    }
    if (!Number.isInteger(input.peopleCount) || input.peopleCount <= 0) {
      return { success: false, reason: '请填写正确的人数（至少 1 人）' };
    }
    if (input.peopleCount > bench.seatCount) {
      return {
        success: false,
        reason: `座位不够：这张长椅只有 ${bench.seatCount} 个座位，本次 ${input.peopleCount} 人坐不下`,
      };
    }
    if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) {
      return { success: false, reason: '请选择预计借坐时长' };
    }

    const conflict = findConflictingMeeting(get().meetings, benchId, input);
    if (conflict) {
      return {
        success: false,
        reason: `时段冲突：${conflict.teamName} 已登记 ${formatTime(conflict.meetAt)} 起借坐 ${formatDuration(conflict.durationMinutes)}，这段时间座位已被占用`,
      };
    }

    const now = new Date().toISOString();
    const meeting: Meeting = {
      id: generateId(),
      benchId,
      teamName: input.teamName.trim() || '周末散步队',
      leaderName: input.leaderName.trim(),
      meetAt: new Date(meetTime).toISOString(),
      peopleCount: input.peopleCount,
      durationMinutes: input.durationMinutes,
      status: 'booked',
      createdAt: now,
      updatedAt: now,
    };
    const newMeetings = [...get().meetings, meeting];
    set({ meetings: newMeetings });
    saveMeetings(newMeetings);
    return { success: true, meeting };
  },

  checkInMeeting: (meetingId) => {
    const now = new Date().toISOString();
    const newMeetings = get().meetings.map((meeting) =>
      meeting.id === meetingId && meeting.status === 'booked'
        ? { ...meeting, status: 'checkedIn' as const, updatedAt: now }
        : meeting
    );
    set({ meetings: newMeetings });
    saveMeetings(newMeetings);
  },

  cancelMeeting: (meetingId) => {
    const now = new Date().toISOString();
    const newMeetings = get().meetings.map((meeting) =>
      meeting.id === meetingId && meeting.status !== 'cancelled'
        ? { ...meeting, status: 'cancelled' as const, updatedAt: now }
        : meeting
    );
    set({ meetings: newMeetings });
    saveMeetings(newMeetings);
  },

  endMeeting: (meetingId) => {
    const now = new Date().toISOString();
    const newMeetings = get().meetings.map((meeting) =>
      meeting.id === meetingId && meeting.status !== 'ended'
        ? { ...meeting, status: 'ended' as const, updatedAt: now }
        : meeting
    );
    set({ meetings: newMeetings });
    saveMeetings(newMeetings);
  },
}));
