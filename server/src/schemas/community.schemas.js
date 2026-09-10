const { z } = require('zod');
const { objectId } = require('./enrollment.schemas');

const createQuestionSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(150),
  body: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
  attachmentIds: z.array(objectId).max(3, 'Maximum 3 attachments').optional().default([]),
});

const updateQuestionSchema = z
  .object({
    title: z.string().trim().min(5).max(150).optional(),
    body: z.string().trim().min(10).max(5000).optional(),
    status: z.enum(['active', 'closed']).optional(),
  })
  .refine((v) => v.title !== undefined || v.body !== undefined || v.status !== undefined, {
    message: 'Nothing to update',
  });

const createAnswerSchema = z.object({
  body: z.string().trim().min(2, 'Answer must be at least 2 characters').max(5000),
  attachmentIds: z.array(objectId).max(2, 'Maximum 2 attachments').optional().default([]),
});

const updateAnswerSchema = z.object({
  body: z.string().trim().min(2).max(5000),
});

module.exports = { createQuestionSchema, updateQuestionSchema, createAnswerSchema, updateAnswerSchema };
