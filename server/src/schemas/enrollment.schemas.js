const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const createEnrollmentSchema = z.object({
  studentId: objectId,
  courseId: objectId,
  status: z.enum(['active', 'pending']).optional().default('active'),
});

const updateEnrollmentSchema = z.object({
  status: z.enum(['active', 'revoked', 'pending']),
});

module.exports = { createEnrollmentSchema, updateEnrollmentSchema, objectId };
