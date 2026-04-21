import { Router } from 'express';
import { admin_controllers } from './admin.controller';
import auth from '../../middlewares/auth';

const adminRouter = Router();

// All admin routes require ADMIN role
adminRouter.use(auth('ADMIN'));

adminRouter.get('/analytics', admin_controllers.get_platform_analytics);
adminRouter.post('/broadcast', admin_controllers.broadcast_announcement);
adminRouter.patch('/change-role', admin_controllers.change_user_role);
adminRouter.get('/payments', admin_controllers.get_all_payments);
adminRouter.get('/referrals/stats', admin_controllers.get_referral_stats);
adminRouter.get('/referrals', admin_controllers.get_all_referrals);
adminRouter.get('/referrals/:id', admin_controllers.get_user_referrals);


export default adminRouter;
