/* Seed: creates default admin, mentor and sample student accounts (development convenience).
 * Idempotent — skips users that already exist. Usage: npm run seed
 */
const { connectDB, disconnectDB } = require('../src/config/db');
const config = require('../src/config/env');
const User = require('../src/models/User');

const upsertUser = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`- exists: ${email} (${existing.role})`);
    return existing;
  }
  const user = await User.create({ name, email, password, role });
  console.log(`+ created: ${email} (${role})`);
  return user;
};

(async () => {
  await connectDB(config.mongoUri);
  console.log('Seeding users...');
  await upsertUser({ name: 'Administrator', email: process.env.SEED_ADMIN_EMAIL || 'admin@lms.test', password: process.env.SEED_ADMIN_PASSWORD || 'admin12345', role: 'admin' });
  await upsertUser({ name: 'Demo Mentor', email: process.env.SEED_MENTOR_EMAIL || 'mentor@lms.test', password: process.env.SEED_MENTOR_PASSWORD || 'mentor12345', role: 'mentor' });
  await upsertUser({ name: 'Demo Student', email: process.env.SEED_STUDENT_EMAIL || 'student@lms.test', password: process.env.SEED_STUDENT_PASSWORD || 'student12345', role: 'student' });
  await disconnectDB();
  console.log('Done.');
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
