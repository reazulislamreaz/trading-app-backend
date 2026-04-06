import { Router } from 'express';
import { notification_controllers } from './notification.controller';
import auth from '../../middlewares/auth';

const notificationRouter = Router();

// All notification routes require authentication
notificationRouter.use(auth('USER', 'ADMIN', 'MASTER'));

notificationRouter.get('/', notification_controllers.get_my_notifications);
notificationRouter.get('/unread-count', notification_controllers.get_unread_count);
notificationRouter.patch('/mark-all-read', notification_controllers.mark_all_as_read);
notificationRouter.patch('/:id/read', notification_controllers.mark_as_read);
notificationRouter.delete('/:id', notification_controllers.delete_notification);

export default notificationRouter;
