import express, { Request } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

import { isAuth } from './middleware/authMiddleware';

import userRoutes from './routes/userRoutes';

import http from 'http';
import { Server } from 'socket.io';

const app = express();
dotenv.config();

// app middlewares
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// routes
app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  return res.send('welcome to our chat rest api.');
});

app.get('/protected', isAuth, (req, res) => {
  return res.status(200).json({ sucess: 'this is a protected route' });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5173',
    methods: ['GET', 'POST', 'PUT'],
    credentials: true,
  },
});

interface IJoinRoomPayload {
  roomId: string;
  userId: string;
  username: string;
}

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('JOIN_ROOM', async (data: IJoinRoomPayload) => {
    socket.join(data.roomId);
    console.log(
      `User with ID: ${socket.id} joined room: ${data.roomId}. user db is: ${data.userId}`
    );

    socket.broadcast
      .to(data.roomId)
      .emit('USER_JOINED', { user: { userId: data.userId, username: data.username } });
  });

  socket.on('ROOM_CREATED', () => {
    socket.broadcast.emit('SHOULD_REFETCH_ROOMS');
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

export default server;
