import express from 'express';
import { protect } from '../middleware/auth.js';
import { archiveHabit, createHabit, deleteHabit, getHabits, reorderHabits, updateHabit} from '../controllers/habitController.js'

const habitRouter = express.Router();

habitRouter.use(protect);

habitRouter.get('/',getHabits);
habitRouter.post('/',createHabit);
habitRouter.put('/reorder',reorderHabits);
habitRouter.put('/:id',updateHabit);
habitRouter.delete('/:id',deleteHabit);
habitRouter.put('/:id/archive',archiveHabit);

export default habitRouter;