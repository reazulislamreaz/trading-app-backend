import { Router } from 'express';
import { signal_controllers } from './signal.controller';
import { signal_validations } from './signal.validation';
import auth from '../../middlewares/auth';
import RequestValidator from '../../middlewares/request_validator';

const signalRouter = Router();

// Public routes — anyone can view signals (but premium signals require subscription via middleware later)
signalRouter.get('/', signal_controllers.get_all_signals);
signalRouter.get('/:id', signal_controllers.get_single_signal);

// Master-only routes (authenticated masters manage their signals)
signalRouter.post(
  '/',
  auth('MASTER'),
  RequestValidator(signal_validations.createSignalSchema),
  signal_controllers.create_signal,
);
signalRouter.get('/my/signals', auth('MASTER'), signal_controllers.get_my_signals);
signalRouter.patch(
  '/:id',
  auth('MASTER'),
  RequestValidator(signal_validations.updateSignalSchema),
  signal_controllers.update_signal,
);
signalRouter.patch(
  '/:id/close',
  auth('MASTER'),
  RequestValidator(signal_validations.closeSignalSchema),
  signal_controllers.close_signal,
);
signalRouter.delete('/:id', auth('MASTER'), signal_controllers.delete_signal);

// Admin routes
signalRouter.patch('/featured/:id', auth('ADMIN'), signal_controllers.toggle_featured);

export default signalRouter;
