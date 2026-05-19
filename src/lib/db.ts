import mongoose from "mongoose";

declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

const cached = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

export async function connectDB(): Promise<mongoose.Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/authentication";

    if (!uri) {
      throw new Error(
        "MONGODB_URI is not defined. Add it to your .env.local file.",
      );
    }
    cached.promise = mongoose
      .connect(uri, {
        // bufferCommands: false means mongoose won't queue operations
        // if the connection drops. Routes will fail fast instead of
        // hanging silently — easier to debug.
        bufferCommands: false,
      })
      .then((m) => m.connection);
  }

  // 3. Await the connection promise and cache the result
  cached.conn = await cached.promise;
  return cached.conn;
}
