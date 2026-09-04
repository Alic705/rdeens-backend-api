import mongoose from "mongoose";
import dns from "dns";

// Fix for Node.js querySrv ECONNREFUSED on Windows with MongoDB Atlas
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (dnsErr) {
  console.warn("Could not set custom DNS servers:", dnsErr.message);
}

// Event listeners for connection monitoring
mongoose.connection.on("connected", () => {
  console.log("🟢 MongoDB connection established successfully.");
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("🟡 MongoDB disconnected. Attempting reconnection...");
});

mongoose.connection.on("reconnected", () => {
  console.log("🟢 MongoDB reconnected successfully.");
});

const connectDb = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (!uri) {
    console.error("🔴 MONGODB_URI is undefined in environment variables");
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`🚀 MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`🔴 MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
      process.exit(1);
    }
  }
};

export default connectDb;