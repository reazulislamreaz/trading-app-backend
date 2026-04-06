export interface TMaster {
  _id?: string;
  accountId: string;
  bio: string;
  specialties: string[];
  yearsOfExperience: number;
  isApproved: boolean;
  approvedAt: Date | null;
  approvedBy: string | null;
  totalSignals: number;
  winningSignals: number;
  losingSignals: number;
  winRate: number;
  avgPnl: number;
  followerCount: number;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TMasterProfile {
  bio?: string;
  specialties?: string[];
  yearsOfExperience?: number;
}
