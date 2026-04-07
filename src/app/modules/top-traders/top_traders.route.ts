import { Router } from 'express';
import { top_traders_controllers } from './top_traders.controller';

const topTradersRouter = Router();

// Public routes — anyone can view top traders
// Use ?limit=3 for top-3 widget, ?limit=10 for full paginated list
topTradersRouter.get('/', top_traders_controllers.get_top_traders);
topTradersRouter.get('/performance/:accountId', top_traders_controllers.get_trader_performance);
topTradersRouter.get('/compare/:accountId1/:accountId2', top_traders_controllers.compare_traders);

export default topTradersRouter;
