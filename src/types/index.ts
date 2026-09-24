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

/** 会合状态：已登记待签到 / 已签到会合中 / 已散场 / 已取消 / 到点未签到 */
export type MeetingStatusType = 'booked' | 'checkedIn' | 'ended' | 'cancelled' | 'noShow';

/** 长椅的占用记录（本地存档，不接后台） */
export interface Meeting {
  id: string;
  benchId: string;
  teamName: string;
  leaderName: string;
  /** 集合时刻，ISO 字符串 */
  meetAt: string;
  /** 人数 */
  peopleCount: number;
  /** 预计借坐时长（分钟） */
  durationMinutes: number;
  status: MeetingStatusType;
  createdAt: string;
  updatedAt: string;
}

/** 领队登记表单入参 */
export interface MeetingInput {
  teamName: string;
  leaderName: string;
  meetAt: string;
  peopleCount: number;
  durationMinutes: number;
}

/** 登记结果：成功或带冲突原因的失败 */
export type MeetingResult =
  | { success: true; meeting: Meeting }
  | { success: false; reason: string };

export interface Bench {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  /** 座位数 */
  seatCount: number;
  material: MaterialType;
  orientation: OrientationType;
  hasBackrest: boolean;
  shadeLevel: ShadeLevelType;
  noiseLevel: NoiseLevelType;
  stayDuration: StayDurationType;
  rating: number;
  review: string;
  experiences: BenchExperience[];
  createdAt: string;
  updatedAt: string;
}

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

export const MEETING_STATUS_LABELS: Record<MeetingStatusType, string> = {
  booked: '待签到',
  checkedIn: '会合中',
  ended: '已散场',
  cancelled: '已取消',
  noShow: '未签到',
};

/** 可选的预计借坐时长（分钟） */
export const MEETING_DURATION_OPTIONS: number[] = [15, 30, 45, 60, 90, 120];

/** 超过集合时刻多少分钟未签到，自动释放时段 */
export const MEETING_GRACE_MINUTES = 10;
