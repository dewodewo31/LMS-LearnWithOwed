const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const respond = require('../utils/respond');
const asyncHandler = require('../utils/asyncHandler');

// GET /users/me
const getMe = asyncHandler(async (req, res) => {
  return respond(res, { data: { user: req.user.toPublic() } });
});

// PATCH /users/me — name/phone/bio/photo + optional password change (PRD §26)
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, bio, photo, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (newPassword) {
    if (!(await user.comparePassword(currentPassword || ''))) {
      throw new ApiError(401, 'Current password is incorrect', { currentPassword: 'Current password is incorrect' });
    }
    user.password = newPassword;
  }
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (bio !== undefined) user.bio = bio;
  if (photo !== undefined) user.photo = photo;
  await user.save();

  return respond(res, { message: 'Profile updated', data: { user: user.toPublic() } });
});

module.exports = { getMe, updateMe };
