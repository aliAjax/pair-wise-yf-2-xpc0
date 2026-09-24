export type MaterialType = 'wood' | 'metal' | 'stone' | 'plastic' | 'mixed';
export type OrientationType = 'east' | 'south' | 'west' | 'north' | 'southeast' | 'northeast' | 'southwest' | 'northwest';
export type ShadeLevelType = 'none' | 'partial' | 'full';
export type NoiseLevelType = 'quiet' | 'moderate' | 'noisy';
export type StayDurationType = 'short' | 'medium' | 'long' | 'verylong';
export type TimePeriodType = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

export interface BenchExperience {
  id: string;
  benchId: string;
  timePeriod: TimePeriodType;
  notes: string;
  rating: number;
}

export interface Bench {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  material: MaterialType;
  orientation: OrientationType;
  hasBackrest: boolean;
  shadeLevel: ShadeLevelType;
  noiseLevel: NoiseLevelType;
  stayDuration: StayDurationType;
  rating: number;
  review: string;
  seatCount: number;
  experiences: BenchExperience[];
  createdAt: string;
  updatedAt: string;
}

/** 会合队伍状态：等待签到 → 已签到 → 已结束（散场/取消/超时） */
export type OccupancyStatus = 'waiting' | 'checked_in' | 'finished';
/** 时段释放（结束）原因 */
export type ReleaseReason = 'finished' | 'cancelled' | 'no_show';

export interface OccupancyRecord {
  id: string;
  benchId: string;
  teamName: string;
  leaderName: string;
  /** 集合时刻 ISO 字符串 */
  startTime: string;
  /** 预计借坐时长（分钟） */
  durationMinutes: number;
  /** 人数 */
  partySize: number;
  status: OccupancyStatus;
  createdAt: string;
  checkedInAt: string | null;
  releasedAt: string | null;
  releaseReason: ReleaseReason | null;
}

/** 一张长椅当前的会合状态（由有效占用记录实时推导） */
export interface BenchMeetupStatus {
  available: boolean;
  active: OccupancyRecord | null;
}

export const OCCUPANCY_STATUS_LABELS: Record<OccupancyStatus, string> = {
  waiting: '待签到',
  checked_in: '集合中',
  finished: '已结束',
};

export const RELEASE_REASON_LABELS: Record<ReleaseReason, string> = {
  finished: '队伍散场',
  cancelled: '领队取消',
  no_show: '到点未签到',
};

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  wood: '木质',
  metal: '金属',
  stone: '石质',
  plastic: '塑料',
  mixed: '混合材质',
};

export const ORIENTATION_LABELS: Record<OrientationType, string> = {
  east: '东',
  south: '南',
  west: '西',
  north: '北',
  southeast: '东南',
  northeast: '东北',
  southwest: '西南',
  northwest: '西北',
};

export const SHADE_LABELS: Record<ShadeLevelType, string> = {
  none: '无遮阴',
  partial: '部分遮阴',
  full: '完全遮阴',
};

export const NOISE_LABELS: Record<NoiseLevelType, string> = {
  quiet: '安静',
  moderate: '一般',
  noisy: '嘈杂',
};

export const STAY_DURATION_LABELS: Record<StayDurationType, string> = {
  short: '少于15分钟',
  medium: '15-30分钟',
  long: '30-60分钟',
  verylong: '1小时以上',
};

export const TIME_PERIOD_LABELS: Record<TimePeriodType, string> = {
  morning: '早晨',
  noon: '中午',
  afternoon: '下午',
  evening: '傍晚',
  night: '夜晚',
};

export const TIME_PERIOD_ICONS: Record<TimePeriodType, string> = {
  morning: 'sunrise',
  noon: 'sun',
  afternoon: 'cloud-sun',
  evening: 'sunset',
  night: 'moon',
};
