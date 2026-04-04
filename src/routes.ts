import { Router } from 'express';
import authRoute from './app/modules/auth/auth.route';
import userRoute from './app/modules/user/user.route';
import uploadRoute from './app/modules/upload.ts/upload.route';
import subscriptionRoute from './app/modules/subscription/subscription.route';


const appRouter = Router();

const moduleRoutes = [
    { path: '/auth', route: authRoute },
    { path: "/user", route: userRoute },
    { path: "/upload", route: uploadRoute },
    { path: "/subscription", route: subscriptionRoute }
];

moduleRoutes.forEach(route => appRouter.use(route.path, route.route));
export default appRouter;