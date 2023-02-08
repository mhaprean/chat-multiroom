import server from './app';
import mongoose from 'mongoose';

const start = async () => {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL is not defined in the env file');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.DATABASE_URL);
    const PORT = process.env.PORT || 3000;

    server.listen(PORT, () => {
      console.log('App started on port: '+ PORT)
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

start();
