import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDb from "../src/config/db.js";
import Contact from "../src/models/contact.js";

async function runContactDbTest() {
  console.log("==========================================");
  console.log("  PHASE 2: LIVE MONGODB INTEGRATION TEST  ");
  console.log("==========================================");

  try {
    await connectDb();

    console.log("\n[TEST 1] Inserting sample contact inquiry document...");
    const testPayload = {
      firstName: "Antigravity",
      lastName: "Verification",
      email: "test.verification@rdeens.com",
      subject: "Project Proposal",
      message: "Testing end-to-end full-stack contact flow with MongoDB Atlas cluster.",
      status: "new",
    };

    const createdContact = await Contact.create(testPayload);
    console.log("✅ Document successfully created!");
    console.log("   ID:", createdContact._id.toString());
    console.log("   Name:", `${createdContact.firstName} ${createdContact.lastName}`);
    console.log("   Email:", createdContact.email);
    console.log("   Subject:", createdContact.subject);
    console.log("   Status:", createdContact.status);
    console.log("   CreatedAt:", createdContact.createdAt);

    console.log("\n[TEST 2] Retrieving contact inquiries from collection...");
    const contacts = await Contact.find().sort({ createdAt: -1 });
    console.log(`✅ Successfully retrieved ${contacts.length} document(s) from 'contacts' collection.`);
    
    contacts.forEach((c, index) => {
      console.log(`   [${index + 1}] ${c.firstName} ${c.lastName} | ${c.email} | ${c.subject} | Status: ${c.status} | Created: ${c.createdAt}`);
    });

    console.log("\n==========================================");
    console.log("  ALL TESTS PASSED: DB & MODEL FULLY OK  ");
    console.log("==========================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("🔴 Test Error:", error);
    process.exit(1);
  }
}

runContactDbTest();
