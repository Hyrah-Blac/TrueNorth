import dns from "dns";
import mongoose from "mongoose";

// Node's built-in DNS resolver (c-ares) can fail to resolve mongodb+srv://
// SRV records against some router/ISP DNS servers, even when the OS
// resolver works fine — a known issue especially on Windows dev machines.
// Pointing Node at public resolvers sidesteps it. Harmless in production
// (Vercel's environment doesn't hit this issue), so it's safe to always set.
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };

if (!global._mongooseCache) {
  global._mongooseCache = cached;
}

/**
 * Returns a cached Mongoose connection, creating one if needed.
 * Caching on `global` is required on Vercel's serverless runtime so that
 * warm function invocations reuse the existing connection instead of
 * exhausting MongoDB Atlas connection limits.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;
