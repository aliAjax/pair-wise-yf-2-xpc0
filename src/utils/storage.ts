import type { Bench, Meeting } from '@/types';

const STORAGE_KEY = 'bench-archive-data';
const MEETING_STORAGE_KEY = 'bench-meeting-records';

export function loadBenches(): Bench[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load benches from localStorage:', error);
  }
  return [];
}

export function saveBenches(benches: Bench[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(benches));
  } catch (error) {
    console.error('Failed to save benches to localStorage:', error);
  }
}

export function clearBenches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear benches from localStorage:', error);
  }
}

/** 旧存档可能没有座位数字段，读取时补默认值 */
export function normalizeBench(bench: Bench): Bench {
  return {
    ...bench,
    seatCount: typeof bench.seatCount === 'number' && bench.seatCount > 0
      ? bench.seatCount
      : 4,
  };
}

export function loadMeetings(): Meeting[] {
  try {
    const data = localStorage.getItem(MEETING_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load meetings from localStorage:', error);
  }
  return [];
}

export function saveMeetings(meetings: Meeting[]): void {
  try {
    localStorage.setItem(MEETING_STORAGE_KEY, JSON.stringify(meetings));
  } catch (error) {
    console.error('Failed to save meetings to localStorage:', error);
  }
}
