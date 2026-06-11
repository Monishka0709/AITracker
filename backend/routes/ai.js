import express from 'express';
import {
    morningMotivation,
    chatAnalysis,
    recoveryPlan,
    weeklyReport,
    suggestHabits
} from '../controllers/aiController.js'
import { protect } from '../middleware/auth.js'

const aiRouter = express.Router();


aiRouter.use(protect);


aiRouter.post('/weekly-report', weeklyReport)
aiRouter.post('/suggest-habits', suggestHabits)
aiRouter.post('/recovery-plan', recoveryPlan)
aiRouter.post('/chat', chatAnalysis)
aiRouter.get('/morning', morningMotivation)

export default aiRouter;
 