import catchAsync from '../../utils/catch_async';
import manageResponse from '../../utils/manage_response';
import { notification_services } from './notification.service';
import httpStatus from 'http-status';

const get_my_notifications = catchAsync(async (req, res) => {
  const accountId = req.user!.userId;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const filters: { isRead?: boolean; type?: string } = {};
  if (req.query.isRead !== undefined) {
    filters.isRead = req.query.isRead === 'true';
  }
  if (req.query.type) {
    filters.type = req.query.type as string;
  }

  const result = await notification_services.get_my_notifications(accountId, page, limit, filters);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Notifications retrieved',
    data: result.data,
    unreadCount: result.unreadCount,
    meta: result.meta,
  });
});

const mark_as_read = catchAsync(async (req, res) => {
  const accountId = req.user!.userId;
  const result = await notification_services.update_notification(accountId, req.params.id as string, { isRead: true });

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Notification marked as read',
    data: result,
  });
});

const update_notification = catchAsync(async (req, res) => {
  const accountId = req.user!.userId;
  const { isRead } = req.body;

  const result = await notification_services.update_notification(accountId, req.params.id as string, { isRead });

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Notification updated',
    data: result,
  });
});

const mark_all_as_read = catchAsync(async (req, res) => {
  const accountId = req.user!.userId;
  const result = await notification_services.mark_all_as_read(accountId);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'All notifications marked as read',
    data: result,
  });
});

const delete_notification = catchAsync(async (req, res) => {
  const accountId = req.user!.userId;
  const result = await notification_services.delete_notification(accountId, req.params.id as string);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

const get_unread_count = catchAsync(async (req, res) => {
  const accountId = req.user!.userId;
  const result = await notification_services.get_unread_count(accountId);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Unread count retrieved',
    data: result,
  });
});

export const notification_controllers = {
  get_my_notifications,
  update_notification,
  mark_as_read,
  mark_all_as_read,
  delete_notification,
  get_unread_count,
};
