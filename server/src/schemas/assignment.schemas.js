const { z } = require('zod');
const Assignment = require('../models/Assignment');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const deadlineSchema = z
  .string()
  .max(40)
  .refine((v) => v === '' || !Number.isNaN(new Date(v).getTime()), 'Invalid date')
  .nullish();

const criterionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional().default(''),
});

const createAssignmentSchema = z.object({
  title: z.string().trim().min(3).max(150),
  instructions: z.string().max(100000).optional().default(''),
  deadline: deadlineSchema,
  assessmentCriteria: z.array(criterionSchema).max(10).optional().default([]),
});

const updateAssignmentSchema = createAssignmentSchema
  .partial()
  .extend({ status: z.enum(Assignment.STATUSES).optional() })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

const assessmentCriteriaSchema = z.array(
  z.object({
    name: z.string().trim().min(1).max(100),
    grade: z.enum(Assignment.GRADES),
    feedback: z.string().max(2000).optional().default(''),
  })
);

const assessmentSchema = z
  .object({
    criteria: assessmentCriteriaSchema.min(1).max(10),
    overallFeedback: z.string().max(2000).optional().default(''),
  })
  .superRefine((data, ctx) => {
    const names = data.criteria.map((c) => c.name);
    if (new Set(names).size !== names.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['criteria'], message: 'Duplicate criteria are not allowed' });
    }
  });

const submitSchema = z.object({
  note: z.string().max(2000).optional().default(''),
});

module.exports = {
  objectId,
  createAssignmentSchema,
  updateAssignmentSchema,
  assessmentSchema,
  submitSchema,
  deadlineSchema,
};
