import express from 'express';
import { protect } from '../middleware/auth.js';
import { getRange, getToday, getHeatmap, getHabitStats, getAllStats, markComplete, unmarkComplete } from '../controllers/logController.js';

const logRouter = express.Router();

logRouter.use(protect);

logRouter.post('/', markComplete);
logRouter.delete('/', unmarkComplete);
logRouter.get('/today', getToday);
logRouter.get('/range', getRange);
logRouter.get('/heatmap', getHeatmap);
logRouter.get('/stats', getAllStats);
logRouter.get('/stats/:habitId', getHabitStats);

export default logRouter;