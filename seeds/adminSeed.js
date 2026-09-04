import dotenv from "dotenv";
dotenv.config();

import connectDb from "../src/config/db.js";
import User from "../src/models/user.js";

const seedAdmin = async () => {
  try {
    await connectDb();
    console.log("MongoDB Connected for seeding");

    const existingAdmin = await User.findOne({ email: "admin@rdeens.com" });
    if (existingAdmin) {
      console.log("Admin already exists: admin@rdeens.com");
      process.exit(0);
    }

    await User.create({
      name: "Super Admin",
      email: "admin@rdeens.com",
      password: "test1234",
      role: "admin",
    });

    console.log("✅ Admin created successfully: admin@rdeens.com / test1234");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed Error:", error.message);
    process.exit(1);
  }
};

seedAdmin();
