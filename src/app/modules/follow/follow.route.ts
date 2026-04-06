import { Router } from 'express';
import { follow_controllers } from './follow.controller';
import auth from '../../middlewares/auth';

const followRouter = Router();

// All follow routes require authentication
followRouter.use(auth('USER', 'ADMIN', 'MASTER'));

// Manage follows
followRouter.post('/follow', follow_controllers.follow_master);
followRouter.post('/unfollow', follow_controllers.unfollow_master);
followRouter.post('/toggle/:id', follow_controllers.toggle_follow);

// View lists
followRouter.get('/following', follow_controllers.get_following);
followRouter.get('/followers/:id', follow_controllers.get_followers);

// Check status
followRouter.get('/status/:id', follow_controllers.check_follow_status);

export default followRouter;
