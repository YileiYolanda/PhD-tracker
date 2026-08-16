export type FundingType = 'full' | 'partial' | 'none' | 'unknown';
export type TierType = 'reach' | 'target' | 'safety';
export type SchoolStatus = 'active' | 'on-hold' | 'applied' | 'admitted' | 'rejected';
export type MaterialType = 'ws' | 'cv' | 'sop' | 'transcript' | 'lor' | 'fee' | 'other';
export type MaterialStatus = 'not-started' | 'in-progress' | 'completed';
export type OutreachResult = 'no-reply' | 'positive' | 'neutral' | 'negative' | 'interview';
export type ImpactLevel = 'high' | 'medium' | 'low';
export type DocCategory = 'sop' | 'ws' | 'cv' | 'other';
export type RecommenderStatus = 'pending' | 'submitted' | 'overdue';

export interface School {
  id: string;
  name: string;
  program: string;
  location: { city: string; country: string };
  deadline: string; // ISO date
  funding: FundingType;
  tier: TierType;
  status: SchoolStatus;
  website: string;
  direction: string;
  notes: string;
}

export interface Material {
  id: string;
  schoolId: string;
  type: MaterialType;
  status: MaterialStatus;
  dueDate?: string;
  notes: string;
}

export interface Professor {
  id: string;
  schoolId: string;
  name: string;
  title: string;
  email: string;
  firstContactDate?: string;
  followUpDate?: string;
  lastEmailContent: string;
  result: OutreachResult;
  impact: ImpactLevel;
  notes: string;
}

export interface Document {
  id: string;
  title: string;
  category: DocCategory;
  targetSchool?: string;
  targetDirection?: string;
  content: string;
  updatedAt: string;
}

export interface Recommender {
  id: string;
  name: string;
  email: string;
  totalLetters: number;
  submittedCount: number;
  reminderDate?: string;
  status: RecommenderStatus;
  notes: string;
}

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  ws: 'Writing Sample',
  cv: 'CV / 简历',
  sop: 'SOP / 个人陈述',
  transcript: '成绩单',
  lor: '推荐信',
  fee: '申请费',
  other: '其他',
};

export const TIER_LABELS: Record<TierType, string> = {
  reach: '冲刺',
  target: '主申',
  safety: '保底',
};

export const FUNDING_LABELS: Record<FundingType, string> = {
  full: '全奖',
  partial: '部分资助',
  none: '无资助',
  unknown: '未知',
};

export const STATUS_LABELS: Record<SchoolStatus, string> = {
  active: '进行中',
  'on-hold': '已搁置',
  applied: '已提交',
  admitted: '已录取',
  rejected: '被拒',
};

export const OUTREACH_RESULT_LABELS: Record<OutreachResult, string> = {
  'no-reply': '未回复',
  positive: '积极',
  neutral: '中性',
  negative: '消极',
  interview: '约面试',
};

export const IMPACT_LABELS: Record<ImpactLevel, string> = {
  high: '高',
  medium: '中',
  low: '低',
};
