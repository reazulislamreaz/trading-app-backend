import { z } from 'zod';

export const createSignalSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(5000).optional(),
  assetType: z.enum(['forex', 'crypto', 'stocks', 'indices', 'commodities']),
  symbol: z.string().min(1).max(20).toUpperCase(),
  signalType: z.enum(['long', 'short']),
  timeframe: z.enum(['m1', 'm5', 'm15', 'm30', 'h1', 'h4', 'd1', 'w1', 'mn1']),
  entryPrice: z.number().positive(),
  entryNotes: z.string().max(1000).optional(),
  stopLoss: z.number().positive().nullable().optional(),
  takeProfit1: z.number().positive().nullable().optional(),
  takeProfit2: z.number().positive().nullable().optional(),
  takeProfit3: z.number().positive().nullable().optional(),
  isPremium: z.boolean().optional(),
  tags: z.array(z.string()).max(10).optional(),
  externalChartUrl: z.string().url().optional().or(z.literal('')),
});

export const updateSignalSchema = createSignalSchema.partial();

export const closeSignalSchema = z.object({
  resultPnl: z.number().nullable().optional(),
  closeNotes: z.string().max(1000).optional(),
});

export const signalQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  assetType: z.enum(['forex', 'crypto', 'stocks', 'indices', 'commodities']).optional(),
  signalType: z.enum(['long', 'short']).optional(),
  status: z.enum(['active', 'closed', 'expired', 'canceled']).optional(),
  isPremium: z.coerce.boolean().optional(),
  authorId: z.string().optional(),
});

export const signal_validations = {
  createSignalSchema,
  updateSignalSchema,
  closeSignalSchema,
  signalQuerySchema,
};
