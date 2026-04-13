import { Router } from 'express';
import { master_controllers } from './master.controller';
import { master_validations } from './master.validation';
import auth from '../../middlewares/auth';
import RequestValidator from '../../middlewares/request_validator';

const masterRouter = Router();

// Public routes - view masters list and single master
masterRouter.get('/', master_controllers.get_all_masters);
masterRouter.get('/:id', master_controllers.get_single_master);

// Master-only routes (authenticated masters manage their profile)
masterRouter.patch(
  '/profile',
  auth('MASTER'),
  RequestValidator(master_validations.masterProfileSchema),
  master_controllers.create_or_update_profile,
);
masterRouter.get('/profile/me', auth('MASTER'), master_controllers.get_my_profile);
masterRouter.get('/stats', auth('MASTER'), master_controllers.get_my_stats);

// Admin-only routes
masterRouter.patch('/featured/:id', auth('ADMIN'), master_controllers.toggle_featured);

export default masterRouter;
