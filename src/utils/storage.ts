import type { Bench, OccupancyRecord } from '@/types';

const STORAGE_KEY = 'bench-archive-data';
const OCCUPANCY_STORAGE_KEY = 'bench-meetup-occupancies';

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

export function loadOccupancies(): OccupancyRecord[] {
  try {
    const data = localStorage.getItem(OCCUPANCY_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load occupancies from localStorage:', error);
  }
  return [];
}

export function saveOccupancies(records: OccupancyRecord[]): void {
  try {
    localStorage.setItem(OCCUPANCY_STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save occupancies to localStorage:', error);
  }
}
