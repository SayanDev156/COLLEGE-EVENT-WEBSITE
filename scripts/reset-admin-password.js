require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');

async function run() {
  if (!process.env.MONGODB_URI) throw new Error('Missing MONGODB_URI');
  if (!process.env.ADMIN_EMAIL) throw new Error('Missing ADMIN_EMAIL');
  if (!process.env.ADMIN_PASSWORD) throw new Error('Missing ADMIN_PASSWORD');

  await mongoose.connect(process.env.MONGODB_URI);

  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

  const result = await AdminUser.findOneAndUpdate(
    { email: String(process.env.ADMIN_EMAIL).trim().toLowerCase() },
    {
      $set: {
        name: process.env.ADMIN_NAME || 'CampusFest Admin',
        email: String(process.env.ADMIN_EMAIL).trim().toLowerCase(),
        passwordHash,
        role: 'admin'
      }
    },
    { upsert: true, new: true }
  );

  console.log(`Admin credential synced for ${result.email}`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error.message);
  try { await mongoose.disconnect(); } catch (_e) {}
  process.exit(1);
});
