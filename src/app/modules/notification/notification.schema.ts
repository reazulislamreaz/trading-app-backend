import { model, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'new_signal'
  | 'subscription_active'
  | 'subscription_expiring'
  | 'subscription_canceled'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'master_approved'
  | 'master_rejected'
  | 'system_announcement';

export interface INotification {
  accountId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link: string;
  data: Record<string, unknown>;
}

const notificationSchema = new Schema<INotification>(
  {
    accountId: { type: Schema.Types.ObjectId, ref: 'account', required: true },
    type: {
      type: String,
      enum: [
        'new_signal',
        'subscription_active',
        'subscription_expiring',
        'subscription_canceled',
        'payment_succeeded',
        'payment_failed',
        'master_approved',
        'master_rejected',
        'system_announcement',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: '' },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Indexes for efficient queries
notificationSchema.index({ accountId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ accountId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

export const Notification_Model = model<INotification>('notification', notificationSchema);
