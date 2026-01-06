
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AnalysisResult {
  riskLevel: RiskLevel;
  riskSpots: string[]; // 瀨嘢位
  scripts: string[]; // 求生劇本
  excuses: string[]; // 合理路過理由
  summary: string; // 兄弟總結
  actionNeeded: 'BLUR' | 'PRIVATE' | 'NONE';
}

export interface ScannedPhoto {
  id: string;
  url: string;
  timestamp: number;
  analyzing: boolean;
  analysis?: AnalysisResult;
}

export interface AppNotification {
  id: string;
  message: string;
  photoId: string;
}
