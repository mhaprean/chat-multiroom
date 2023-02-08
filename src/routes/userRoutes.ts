import express from 'express';
import { getAllUsers } from '../controllers/userController';

import { isAuth } from '../middleware/authMiddleware';

const router = express.Router();


router.get('/', getAllUsers);


export default router;