import express from 'express'
import { login, me, register, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login',login);
authRouter.get('/me',protect, me);
authRouter.put('/profile', protect, updateProfile);

export default authRouter;