import { model, Schema } from "mongoose";

export interface ISubscriptionPlan {
  planId: string;
  name: string;
  description: string;
  price: number; // In cents
  currency: string;
  interval: "month" | "year";
  stripeProductId?: string; // Stripe Product ID
  stripePriceId?: string; // Stripe Price ID (optional for development)
  features: string[];
  signalLimit: number; // -1 for unlimited
  mediaAccess: boolean;
  prioritySupport: boolean;
  isActive: boolean;
  durationInDays?: number; // Optional: duration of the plan in days
  tier: "free" | "basic" | "pro" | "master";
  syncedToStripe: boolean; // Track if plan is synced with Stripe
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    planId: { type: String, required: true }, // Indexed via schema.index() below
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true }, // In cents
    currency: { type: String, default: "usd" },
    interval: { type: String, enum: ["month", "year"], default: "month" },
    stripeProductId: { type: String }, // Stripe Product ID (optional for dev)
    stripePriceId: { type: String }, // Stripe Price ID (optional for dev)
    features: { type: [String], required: true },
    signalLimit: { type: Number, default: -1 }, // -1 for unlimited
    mediaAccess: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    durationInDays: { type: Number },
    tier: {
      type: String,
      enum: ["free", "basic", "pro", "master"],
      default: "basic",
    },
    syncedToStripe: { type: Boolean, default: false }, // Track Stripe sync status
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

// Indexes for optimized queries (defined here to avoid duplicate index warnings)
subscriptionPlanSchema.index({ planId: 1 }, { unique: true }); // Unique plan identifier
subscriptionPlanSchema.index({ isActive: 1 }); // Filter active plans
subscriptionPlanSchema.index({ tier: 1 }); // Tier-based queries
subscriptionPlanSchema.index({ syncedToStripe: 1 }); // Filter synced plans

export const SubscriptionPlan_Model = model<ISubscriptionPlan>(
  "subscriptionPlan",
  subscriptionPlanSchema,
);

// Default plans to seed on first run
export const DEFAULT_PLANS: Omit<ISubscriptionPlan, "_id">[] = [
  {
    planId: "free",
    name: "Free Plan",
    description: "Get started with basic signal access",
    price: 0,
    currency: "usd",
    interval: "month",
    stripePriceId: "", // No Stripe price needed for free plan
    features: [
      "3 signals per month",
      "Basic signal data only",
      "No chart images",
      "No video analysis",
      "Community support",
    ],
    signalLimit: 3,
    mediaAccess: false,
    prioritySupport: false,
    isActive: true,
    tier: "free",
    syncedToStripe: true, // Free plan doesn't need Stripe sync
  },
  {
    planId: "basic_monthly",
    name: "Basic Plan (Monthly)",
    description: "Perfect for beginner traders",
    price: 2900, // $29.00
    currency: "usd",
    interval: "month",
    stripePriceId: "price_basic_monthly", // Will be replaced with actual Stripe Price ID
    features: [
      "50 signals per month",
      "All Master Traders",
      "Chart images included",
      "Email support",
      "Basic analytics",
    ],
    signalLimit: 50,
    mediaAccess: true,
    prioritySupport: false,
    isActive: true,
    tier: "basic",
    syncedToStripe: false,
  },
  {
    planId: "basic_yearly",
    name: "Basic Plan (Yearly)",
    description: "Save 2 months with annual billing",
    price: 29000, // $290.00 (equivalent to 10 months)
    currency: "usd",
    interval: "year",
    stripePriceId: "price_basic_yearly", // Will be replaced with actual Stripe Price ID
    features: [
      "50 signals per month",
      "All Master Traders",
      "Chart images included",
      "Email support",
      "Basic analytics",
      "Save 2 months",
    ],
    signalLimit: 50,
    mediaAccess: true,
    prioritySupport: false,
    isActive: true,
    tier: "basic",
    syncedToStripe: false,
  },
  {
    planId: "pro_monthly",
    name: "Pro Plan (Monthly)",
    description: "Advanced features for serious traders",
    price: 7900, // $79.00
    currency: "usd",
    interval: "month",
    stripePriceId: "price_pro_monthly", // Will be replaced with actual Stripe Price ID
    features: [
      "Unlimited signals",
      "All Master Traders",
      "Chart images & video analysis",
      "Priority support",
      "Advanced analytics",
      "Early access to new features",
      "Leaderboard eligibility",
    ],
    signalLimit: -1, // Unlimited
    mediaAccess: true,
    prioritySupport: true,
    isActive: true,
    tier: "pro",
    syncedToStripe: false,
  },
  {
    planId: "pro_yearly",
    name: "Pro Plan (Yearly)",
    description: "Save 2 months with annual billing",
    price: 79000, // $790.00 (equivalent to 10 months)
    currency: "usd",
    interval: "year",
    stripePriceId: "price_pro_yearly", // Will be replaced with actual Stripe Price ID
    features: [
      "Unlimited signals",
      "All Master Traders",
      "Chart images & video analysis",
      "Priority support",
      "Advanced analytics",
      "Early access to new features",
      "Leaderboard eligibility",
      "Save 2 months",
    ],
    signalLimit: -1, // Unlimited
    mediaAccess: true,
    prioritySupport: true,
    isActive: true,
    tier: "pro",
    syncedToStripe: false,
  },
  {
    planId: "master_monthly",
    name: "Master Trader Plan (Monthly)",
    description: "For signal providers and expert traders",
    price: 4900, // $49.00
    currency: "usd",
    interval: "month",
    stripePriceId: "price_master_monthly", // Will be replaced with actual Stripe Price ID
    features: [
      "Publish unlimited signals",
      "Upload charts & videos",
      "Follower statistics",
      "Performance analytics",
      "Revenue share (80%)",
      "Priority support",
      "Master Trader badge",
    ],
    signalLimit: -1, // Unlimited
    mediaAccess: true,
    prioritySupport: true,
    isActive: true,
    tier: "master",
    syncedToStripe: false,
  },
];
