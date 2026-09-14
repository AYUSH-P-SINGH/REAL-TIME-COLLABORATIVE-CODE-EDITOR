// Comprehensive Zod Validation Schemas
const { z } = require('zod');

// Common patterns
const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters');

const emailSchema = z.string().email('Invalid email address');

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters');

// Auth Schemas
const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Project Schemas
const projectCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be less than 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
});

const projectUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be less than 200 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
});

// File Schemas
const fileCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name must be less than 255 characters'),
  project: z.string().optional(),
  projectId: z.string().optional(),
  path: z.string().optional(),
  type: z.string().optional(),
  content: z.string().optional(),
});

const fileUpdateSchema = z.object({
  content: z.string().optional(),
  version: z.number().optional(),
});

// User Schemas
const userUpdateSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
});

// Export all schemas
module.exports = {
  registerSchema,
  loginSchema,
  projectCreateSchema,
  projectUpdateSchema,
  fileCreateSchema,
  fileUpdateSchema,
  userUpdateSchema,
};
