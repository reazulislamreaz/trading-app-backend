import { Router } from 'express';
import authRoute from './app/modules/auth/auth.route';
import userRoute from './app/modules/user/user.route';
import uploadRoute from './app/modules/upload.ts/upload.route';
import subscriptionRoute from './app/modules/subscription/subscription.route';
import signalRouter from './app/modules/signal/signal.route';
import masterRouter from './app/modules/master/master.route';
import followRouter from './app/modules/follow/follow.route';
import notificationRouter from './app/modules/notification/notification.route';
import adminRouter from './app/modules/admin/admin.route';

const appRouter = Router();

const moduleRoutes = [
    // Core modules
    { path: '/auth', route: authRoute },
    { path: '/user', route: userRoute },
    { path: '/upload', route: uploadRoute },
    { path: '/subscription', route: subscriptionRoute },

    // Signal platform modules
    { path: '/signals', route: signalRouter },
    { path: '/masters', route: masterRouter },
    { path: '/follow', route: followRouter },
    { path: '/notifications', route: notificationRouter },

    // Admin module
    { path: '/admin', route: adminRouter },
];

moduleRoutes.forEach(route => appRouter.use(route.path, route.route));
export default appRouter;