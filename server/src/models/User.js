const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['admin', 'mentor', 'student'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, default: 'student' },
    photo: { type: String, default: null },
    phone: { type: String, default: null, maxlength: 30 },
    bio: { type: String, default: null, maxlength: 2000 },
    isDeleted: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// docs/DATA-MODEL.md §12: users.email UNIQUE (unique: true on field)

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function toPublic() {
  const { _id, name, email, role, photo, phone, bio, createdAt, lastLoginAt } = this;
  return { id: _id, name, email, role, photo, phone, bio, createdAt, lastLoginAt };
};

const User = mongoose.model('User', userSchema);
User.ROLES = ROLES;
module.exports = User;
