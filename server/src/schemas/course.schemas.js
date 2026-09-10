const { z } = require('zod');

const LEVELS = ['beginner', 'intermediate', 'advanced'];

const createCourseSchema = z.object({
  title: z.string().trim().min(3).max(150),
  shortDescription: z.string().trim().max(300).optional().default(''),
  description: z.string().max(100000).optional().default(''),
  thumbnail: z.string().max(500).nullish(),
  category: z.string().trim().max(60).nullish(),
  mentorId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(), // admin may assign mentor
  level: z.enum(LEVELS),
  language: z.string().trim().max(10).optional().default('id'),
  requirements: z.array(z.string().trim().min(1).max(300)).max(20).optional().default([]),
  learningObjectives: z.array(z.string().trim().min(1).max(300)).max(20).optional().default([]),
});

const updateCourseSchema = createCourseSchema.partial().omit({ mentorId: true }).extend({
  mentorId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(), // admin-only, enforced in controller
});

const createLessonSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    contentType: z.enum(['text', 'video']),
    textContent: z.string().max(200000).nullish(),
    youtubeUrl: z.string().max(500).nullish(),
    duration: z.number().int().min(0).max(600).nullish(),
    isPublished: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.contentType === 'text' && !data.textContent?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['textContent'], message: 'Text content is required for text lessons' });
    }
    if (data.contentType === 'video' && !data.youtubeUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['youtubeUrl'], message: 'YouTube URL is required for video lessons' });
    }
  });

const updateLessonSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  textContent: z.string().max(200000).nullish(),
  youtubeUrl: z.string().max(500).nullish(),
  duration: z.number().int().min(0).max(600).nullish(),
  isPublished: z.boolean().optional(),
});

const reorderSchema = z.object({
  orders: z
    .array(z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/), order: z.number().int().min(1) }))
    .min(1)
    .max(500),
});

module.exports = { createCourseSchema, updateCourseSchema, createLessonSchema, updateLessonSchema, reorderSchema, LEVELS };
