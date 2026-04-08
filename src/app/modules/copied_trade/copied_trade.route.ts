import { Router } from 'express';
import { copied_trade_controllers } from './copied_trade.controller';
import auth from '../../middlewares/auth';
import RequestValidator from '../../middlewares/request_validator';
import { copied_trade_validations } from './copied_trade.validation';

const copiedTradeRouter = Router();

// Public routes — anyone can view master copier stats
copiedTradeRouter.get(
  '/masters/:masterId/copied-stats',
  copied_trade_controllers.get_master_copied_stats
);

// Authenticated user routes
copiedTradeRouter.use(auth('USER', 'MASTER', 'ADMIN'));

// Copy a signal
copiedTradeRouter.post(
  '/signals/:signalId/copy',
  copied_trade_controllers.copy_signal
);

// Log trade result
copiedTradeRouter.post(
  '/log',
  RequestValidator(copied_trade_validations.logTradeSchema),
  copied_trade_controllers.log_trade
);

// Trade journal — my history
copiedTradeRouter.get(
  '/',
  copied_trade_controllers.get_trade_history
);

// Single trade detail
copiedTradeRouter.get(
  '/:id',
  copied_trade_controllers.get_trade_by_id
);

// Delete a trade
copiedTradeRouter.delete(
  '/:id',
  copied_trade_controllers.delete_trade
);

// Cancel a pending copy
copiedTradeRouter.delete(
  '/:id/cancel',
  copied_trade_controllers.cancel_copy
);

// Master-only: view copiers for their signal
copiedTradeRouter.get(
  '/signals/:signalId/copiers',
  auth('MASTER'),
  copied_trade_controllers.get_signal_copiers
);

export default copiedTradeRouter;
