// API レスポンスに対応する型定義

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SummaryMetric {
  current: number;
  previous: number;
  delta: number;
  sparkline: number[];
}

export interface SummaryResponse {
  updatedAt: string;
  revenue: SummaryMetric;
  orders: SummaryMetric;
  aov: SummaryMetric;
}

export interface MonthlyPoint {
  month: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface MonthlyResponse {
  year: number;
  monthly: MonthlyPoint[];
}

export interface WeeklyPoint {
  week: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface WeeklyResponse {
  month: string;
  weekly: WeeklyPoint[];
}

export interface ProductRankingItem {
  id: string;
  name: string;
  category: string;
  revenue: number;
  units: number;
}

export interface SalesRankingResponse {
  year: number;
  ranking: ProductRankingItem[];
}

export interface OrderRankingResponse {
  year: number;
  monthly: { month: string; label: string; orders: number }[];
  ranking: ProductRankingItem[];
}

export interface CategoryAggregate {
  category: string;
  revenue: number;
  units: number;
  orderCount: number;
  averageOrderValue: number;
  share: number;
}

export interface CategoryResponse {
  year: number;
  overallAov: number;
  monthly: { month: string; label: string; aov: number }[];
  categories: CategoryAggregate[];
}
