const router = require('express').Router();
const { z } = require('zod');
const { listPublicCourses, listRandomPublicCourses, getPublicCourse } = require('../controllers/course.controller');
const validate = require('../middleware/validate');

// Public, unauthenticated — landing page module listing (published courses only).
router.get('/public/courses', listPublicCourses);
router.get('/public/courses/random', listRandomPublicCourses);
// Registered before :slug so "random" is never treated as a slug.
router.get('/public/courses/:slug', validate(z.object({ slug: z.string().min(1).max(200) }), 'params'), getPublicCourse);

module.exports = router;
