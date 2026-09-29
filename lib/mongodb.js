import mongoose from 'mongoose';

// Cache the connection across hot reloads / serverless invocations
const cached = global._mongooseCache || (global._mongooseCache = { conn: null, promise: null });

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set. Create .env.local (see .env.example).');
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
