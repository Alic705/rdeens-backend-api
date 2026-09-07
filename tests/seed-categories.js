import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDb from "../src/config/db.js";
import Category from "../src/models/Category.js";

const defaultCategories = [
  { name: "Web Development", description: "Frontend, backend, full-stack frameworks, SSR, and web engineering." },
  { name: "AI & Automation", description: "Machine learning, LLMs, neural networks, and business automation." },
  { name: "Design Systems", description: "UI/UX architecture, Figma tokens, responsive components, and accessibility." },
  { name: "Cloud Architecture", description: "AWS, GCP, Azure, microservices, containerization, and distributed systems." },
  { name: "Mobile Apps", description: "iOS, Android, React Native, Flutter, and progressive web apps." },
  { name: "DevOps & Scaling", description: "CI/CD pipelines, Docker, Kubernetes, database sharding, and monitoring." },
  { name: "Business Strategy", description: "Digital transformation, tech leadership, agile execution, and growth." },
];

async function seedCategories() {
  console.log("Seeding default categories to MongoDB...");
  await connectDb();

  for (const cat of defaultCategories) {
    const exists = await Category.findOne({ name: cat.name });
    if (!exists) {
      await Category.create(cat);
      console.log(`✅ Seeded Category: "${cat.name}"`);
    } else {
      console.log(`ℹ️ Category already exists: "${cat.name}"`);
    }
  }

  const all = await Category.find({}).sort({ name: 1 });
  console.log(`\nTotal categories in MongoDB: ${all.length}`);
  all.forEach((c, idx) => {
    console.log(` [${idx + 1}] ${c.name} (${c.slug})`);
  });

  await mongoose.connection.close();
  console.log("Database connection closed.");
  process.exit(0);
}

seedCategories().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
