import { AppError } from '../../utils/app_error';
import httpStatus from 'http-status';
import { Notification_Model, NotificationType } from './notification.schema';
import { Types } from 'mongoose';

interface TCreateNotification {
  accountId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
}

/**
 * Create a notification for a user
 */
const create_notification = async (data: TCreateNotification) => {
  const notification = await Notification_Model.create({
    accountId: new Types.ObjectId(data.accountId),
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link || '',
    data: data.data || {},
  });

  return notification;
};

/**
 * Get notifications for a user with pagination
 */
const get_my_notifications = async (
  accountId: string,
  page: number = 1,
  limit: number = 20,
  filters: { isRead?: boolean; type?: string } = {}
) => {
  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = { accountId: new Types.ObjectId(accountId) };

  if (filters.isRead !== undefined) {
    query.isRead = filters.isRead;
  }
  if (filters.type) {
    query.type = filters.type;
  }

  const notifications = await Notification_Model.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification_Model.countDocuments(query);
  const unreadCount = await Notification_Model.countDocuments({
    accountId: new Types.ObjectId(accountId),
    isRead: false,
  });

  return {
    data: notifications,
    unreadCount,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update a notification (currently supports toggling isRead status)
 */
const update_notification = async (accountId: string, notificationId: string, data: { isRead?: boolean }) => {
  if (!Types.ObjectId.isValid(notificationId)) {
    throw new AppError('Invalid notification ID', httpStatus.BAD_REQUEST);
  }

  const notification = await Notification_Model.findOne({
    _id: new Types.ObjectId(notificationId),
    accountId: new Types.ObjectId(accountId),
  });

  if (!notification) {
    throw new AppError('Notification not found', httpStatus.NOT_FOUND);
  }

  if (data.isRead !== undefined) {
    notification.isRead = data.isRead;
    await notification.save();
  }

  return notification;
};

/**
 * Mark a single notification as read (kept for backward compatibility, delegates to update_notification)
 */
const mark_as_read = async (accountId: string, notificationId: string) => {
  return update_notification(accountId, notificationId, { isRead: true });
};

/**
 * Mark all notifications as read for a user
 */
const mark_all_as_read = async (accountId: string) => {
  const result = await Notification_Model.updateMany(
    { accountId: new Types.ObjectId(accountId), isRead: false },
    { $set: { isRead: true } }
  );

  return { markedCount: result.modifiedCount };
};

/**
 * Delete a notification
 */
const delete_notification = async (accountId: string, notificationId: string) => {
  if (!Types.ObjectId.isValid(notificationId)) {
    throw new AppError('Invalid notification ID', httpStatus.BAD_REQUEST);
  }

  const deleted = await Notification_Model.findOneAndDelete({
    _id: new Types.ObjectId(notificationId),
    accountId: new Types.ObjectId(accountId),
  });

  if (!deleted) {
    throw new AppError('Notification not found', httpStatus.NOT_FOUND);
  }

  return { message: 'Notification deleted' };
};

/**
 * Get unread notification count for a user
 */
const get_unread_count = async (accountId: string) => {
  const count = await Notification_Model.countDocuments({
    accountId: new Types.ObjectId(accountId),
    isRead: false,
  });

  return { unreadCount: count };
};

/**
 * Admin: broadcast announcement to all users
 */
const broadcast_announcement = async (
  title: string,
  message: string,
  link?: string,
  targetRole?: string
) => {
  const query: Record<string, unknown> = {};
  if (targetRole) {
    query.role = targetRole;
  }

  // Import Account_Model here to avoid circular dependency
  const { Account_Model } = await import('../auth/auth.schema');

  const accounts = await Account_Model.find(query).select('_id');

  if (accounts.length === 0) {
    return { sentCount: 0 };
  }

  const notifications = accounts.map((account) => ({
    accountId: account._id,
    type: 'system_announcement' as NotificationType,
    title,
    message,
    link: link || '',
    data: {},
  }));

  await Notification_Model.insertMany(notifications);

  return { sentCount: accounts.length };
};

export const notification_services = {
  create_notification,
  get_my_notifications,
  update_notification,
  mark_as_read,
  mark_all_as_read,
  delete_notification,
  get_unread_count,
  broadcast_announcement,
};
