import { model, Schema, Types } from 'mongoose';

export type SignalType = 'long' | 'short';
export type SignalStatus = 'active' | 'closed' | 'expired' | 'canceled';
export type AssetType = 'forex' | 'crypto' | 'stocks' | 'indices' | 'commodities';
export type Timeframe = 'm1' | 'm5' | 'm15' | 'm30' | 'h1' | 'h4' | 'd1' | 'w1' | 'mn1';

export interface ISignal {
  authorId: Types.ObjectId;
  title: string;
  description: string;
  assetType: AssetType;
  symbol: string;
  signalType: SignalType;
  timeframe: Timeframe;

  // Entry details
  entryPrice: number;
  entryNotes: string;

  // Exit targets
  stopLoss: number | null;
  takeProfit1: number | null;
  takeProfit2: number | null;
  takeProfit3: number | null;

  // Signal state
  status: SignalStatus;
  isPremium: boolean;
  isFeatured: boolean;

  // Performance tracking
  resultPnl: number | null;
  closedAt: Date | null;
  closeNotes: string;

  // Engagement counters
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  commentCount: number;

  // Metadata
  tags: string[];
  externalChartUrl: string;
}

const signalSchema = new Schema<ISignal>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'account', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    assetType: {
      type: String,
      enum: ['forex', 'crypto', 'stocks', 'indices', 'commodities'],
      required: true,
    },
    symbol: { type: String, required: true },
    signalType: { type: String, enum: ['long', 'short'], required: true },
    timeframe: {
      type: String,
      enum: ['m1', 'm5', 'm15', 'm30', 'h1', 'h4', 'd1', 'w1', 'mn1'],
      required: true,
    },

    // Entry details
    entryPrice: { type: Number, required: true },
    entryNotes: { type: String, default: '' },

    // Exit targets
    stopLoss: { type: Number, default: null },
    takeProfit1: { type: Number, default: null },
    takeProfit2: { type: Number, default: null },
    takeProfit3: { type: Number, default: null },

    // Signal state
    status: { type: String, enum: ['active', 'closed', 'expired', 'canceled'], default: 'active' },
    isPremium: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },

    // Performance tracking
    resultPnl: { type: Number, default: null },
    closedAt: { type: Date, default: null },
    closeNotes: { type: String, default: '' },

    // Engagement counters
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },

    // Metadata
    tags: { type: [String], default: [] },
    externalChartUrl: { type: String, default: '' },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Indexes for optimized queries
signalSchema.index({ authorId: 1, status: 1 });
signalSchema.index({ authorId: 1, createdAt: -1 });
signalSchema.index({ assetType: 1, status: 1 });
signalSchema.index({ signalType: 1, status: 1 });
signalSchema.index({ isPremium: 1 });
signalSchema.index({ isFeatured: 1 });
signalSchema.index({ createdAt: -1 });

export const Signal_Model = model<ISignal>('signal', signalSchema);
