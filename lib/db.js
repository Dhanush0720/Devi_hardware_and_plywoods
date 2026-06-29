import mongoose from 'mongoose';
import dns from 'dns';

if (typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (err) {
    console.warn('[db] Failed to set custom DNS servers', err);
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn(
    '[db] MONGODB_URI is not set. Add it to your .env.local file before running the app.'
  );
}

// Reuse the connection across hot reloads / serverless invocations.
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false
      })
      .then((mongooseInstance) => mongooseInstance);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
