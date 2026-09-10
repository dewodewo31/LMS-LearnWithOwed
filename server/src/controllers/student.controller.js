const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const respond = require('../utils/respond');
const asyncHandler = require('../utils/asyncHandler');
const { buildMeta, parsePagination } = require('../utils/paginate');

/** GET /students — admin: all students; mentor: students enrolled in their courses (PRD matrix). */
const listStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { keyword } = req.query;

  const filter = { role: 'student' };
  if (req.user.role === 'mentor') {
    const Course = require('../models/Course');
    const Enrollment = require('../models/Enrollment');
    const courseIds = (await Course.find({ mentorId: req.user._id }).select('_id')).map((c) => c._id);
    const studentIds = (await Enrollment.find({ courseId: { $in: courseIds } }).distinct('studentId'));
    filter._id = { $in: studentIds };
  }
  if (keyword) {
    const rx = new RegExp(String(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [total, students] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  return respond(res, { data: { students: students.map((s) => s.toPublic()) }, meta: buildMeta({ page, limit, total }) });
});

/** GET /students/:id */
const getStudent = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student', isDeleted: false });
  if (!student) throw new ApiError(404, 'Student not found');
  return respond(res, { data: { student: student.toPublic() } });
});

/** POST /students — admin creates student accounts (PRD §25). */
const createStudent = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email is already registered', { email: 'Email is already registered' });
  const student = await User.create({ name, email, password, phone: phone || null, role: 'student' });
  return respond(res, { status: 201, message: 'Student created', data: { student: student.toPublic() } });
});

/** PATCH /students/:id — admin. */
const updateStudent = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found');

  const { name, email, password, phone, isDeleted } = req.body;
  if (email && email !== student.email) {
    const dup = await User.findOne({ email, _id: { $ne: student._id } });
    if (dup) throw new ApiError(409, 'Email is already registered', { email: 'Email is already registered' });
    student.email = email;
  }
  if (name !== undefined) student.name = name;
  if (phone !== undefined) student.phone = phone;
  if (isDeleted !== undefined) student.isDeleted = isDeleted;
  if (password) student.password = password; // pre-save hook hashes
  await student.save();

  return respond(res, { message: 'Student updated', data: { student: student.toPublic() } });
});

/** DELETE /students/:id — soft delete (PRD §69). */
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found');
  student.isDeleted = true;
  await student.save({ validateBeforeSave: false });
  return respond(res, { message: 'Student deactivated' });
});

module.exports = { listStudents, getStudent, createStudent, updateStudent, deleteStudent };
