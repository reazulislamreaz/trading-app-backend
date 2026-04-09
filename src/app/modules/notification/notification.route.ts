import { Router } from 'express';
import { notification_controllers } from './notification.controller';
import auth from '../../middlewares/auth';

const notificationRouter = Router();

// All notification routes require authentication
notificationRouter.use(auth('USER', 'ADMIN', 'MASTER'));

// GET / - Get all notifications (empty body) or unread only (?isRead=true)
notificationRouter.get('/', notification_controllers.get_my_notifications);

// GET /unread-count - Get unread notification count
notificationRouter.get('/unread-count', notification_controllers.get_unread_count);

// PATCH / - Mark all as read (body: { isRead: true }) or update single notification (/:id with body)
notificationRouter.patch('/', notification_controllers.update_notification);

// Backward compatibility: Keep old mark-all-read endpoint
notificationRouter.patch('/mark-all-read', (req, res) => {
  req.params.id = undefined;
  req.body = { isRead: true };
  return notification_controllers.update_notification(req, res);
});

// PATCH /:id - Update single notification
notificationRouter.patch('/:id', notification_controllers.update_notification);

// DELETE /:id - Delete a notification
notificationRouter.delete('/:id', notification_controllers.delete_notification);

export default notificationRouter;
