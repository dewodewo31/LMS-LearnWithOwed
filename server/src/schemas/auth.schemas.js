const { z } = require('zod');

const password = z.string().min(8, 'Password must be at least 8 characters').max(128);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password,
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, 'Password is required'),
});

const updateMeSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(30).nullish(),
    bio: z.string().trim().max(2000).nullish(),
    photo: z.string().max(500).nullish(),
    currentPassword: z.string().optional(),
    newPassword: password.optional(),
  })
  .refine((d) => !(d.newPassword && !d.currentPassword), {
    message: 'Current password is required to change password',
    path: ['currentPassword'],
  });

const createStudentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password,
  phone: z.string().trim().max(30).nullish(),
});

const updateStudentSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  password: password.optional(),
  phone: z.string().trim().max(30).nullish(),
  isDeleted: z.boolean().optional(),
});

module.exports = { registerSchema, loginSchema, updateMeSchema, createStudentSchema, updateStudentSchema };
