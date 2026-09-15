const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const config = require('./config/env');
const { generalLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/error');

const authRoutes = require('./routes/auth.routes');
const publicRoutes = require('./routes/public.routes');
const userRoutes = require('./routes/user.routes');
const studentRoutes = require('./routes/student.routes');
const courseRoutes = require('./routes/course.routes');
const lessonRoutes = require('./routes/lesson.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const progressRoutes = require('./routes/progress.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const uploadRoutes = require('./routes/upload.routes');
const communityRoutes = require('./routes/community.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: config.isTest ? true : [config.frontendUrl, 'http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' })); // request size limits (docs SECURITY.md §1)
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
if (!config.isTest) app.use(morgan(config.isProd ? 'combined' : 'dev'));

app.use('/api/v1', generalLimiter);
app.use('/uploads', express.static(path.resolve(config.uploadPath)));

app.get('/health', (_req, res) => res.json({ success: true, message: 'OK', data: { uptime: process.uptime() } }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', publicRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/lessons', lessonRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1', progressRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1', communityRoutes);
app.use('/api/v1', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
