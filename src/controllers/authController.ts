import User, { IUser, IUserModel } from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const signJWTToken = (userId: string, role = 'user') => {
  return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET || 'jwt_secret', {
    expiresIn: '90d',
  });
};

const signJWTRefreshToken = (userId: string, role = 'user') => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_REFRESH_SECRET || 'jwt_refresh_secret',
    {
      expiresIn: '90d',
    }
  );
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const newUser = new User({ ...req.body, password: hash });

    const user = await newUser.save();

    if (user && user._doc) {
      const { password, ...rest } = user._doc;

      const token = signJWTToken(user.id, user.role);

      const refreshToken = signJWTRefreshToken(user.id, user.role);

      return res
        .cookie('jwt_refresh_token', refreshToken, {
          httpOnly: true,
        })
        .status(201)
        .json({ message: 'User has been created!', access_token: token, user: rest });
    }
  } catch (err) {
    return res.status(400).json({ err });
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findOne({ name: req.body.name });
    if (!user) return res.status(400).json({ message: 'Wrong Username or Password' });

    const isCorrect = await bcrypt.compare(req.body.password, user.password);

    if (!isCorrect) return res.status(400).json({ message: 'Wrong Credentials!' });

    const token = signJWTToken(user.id, user.role);

    const refreshToken = signJWTRefreshToken(user.id, user.role);

    if (user && user._doc) {
      const { password, ...rest } = user._doc;

      return res
        .cookie('jwt_refresh_token', refreshToken, {
          httpOnly: true,
        })
        .status(200)
        .json({ message: 'Welcome back!', access_token: token, user: rest });
    }
  } catch (err) {
    next(err);
  }
};

export const profile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.userId;
    const user = await User.findById(id).select({ password: 0 });

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  const cookies = req.cookies;
  if (!cookies?.jwt_refresh_token)
    return res.status(401).json('No refresh token found. Please login again');

  const existingToken = cookies.jwt_refresh_token as string;
  res.clearCookie('jwt_refresh_token', { httpOnly: true });

  jwt.verify(existingToken, process.env.JWT_REFRESH_SECRET || 'jwt_refresh_secret', (err, user) => {
    // if the token expired or is not valid we set the http status to 401 Unauthorized
    if (err) return res.status(401).json('Wrong or expired refresh token. Please login again');
    if (user && typeof user !== 'string') {
      if (user.id) {
        const token = signJWTToken(user.id, user.role);

        // const refreshToken = signJWTRefreshToken(user.id, user.role);

        return (
          res
            .clearCookie('jwt_refresh_token', { httpOnly: true })
            // .cookie('jwt_refresh_token', refreshToken, {
            //   httpOnly: true,
            // })
            .status(200)
            .json({ access_token: token })
        );
      }
    }
  });
};

const authController = {
  register,
  login,
  profile,
  refreshToken,
};

export default authController;
