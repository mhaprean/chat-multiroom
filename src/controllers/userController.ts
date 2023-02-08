import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import Joi from 'joi';

export const getAllUsers = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find().select('-password');

    return res.status(200).json(users);
  } catch (error) {
    return res.status(400).json(error);
  }
};
