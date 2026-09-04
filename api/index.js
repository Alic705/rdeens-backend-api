import app from "../app.js";
import connectDb from "../src/config/db.js";

export default async function handler(req, res) {
  try {
    await connectDb();
  } catch (err) {
    console.error("Database connection error in Vercel handler:", err);
  }
  return app(req, res);
}
