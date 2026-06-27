// Comprehensive Zod Validation Schemas
const { z } = require('zod');

// Common patterns
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[!@#$%^&*]/, 'Password must contain special character');

const emailSchema = z.string().email('Invalid email address');

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters');

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
    .max(255, 'File name must be less than 255 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid file name'),
  projectId: z.string().regex(/^[0-9a-f]{24}$/, 'Invalid project ID'),
  language: z
    .enum([
      'javascript',
      'typescript',
      'python',
      'java',
      'cpp',
      'csharp',
      'ruby',
      'go',
      'rust',
      'html',
      'css',
      'sql',
      'json',
      'xml',
      'yaml',
    ])
    .optional()
    .default('javascript'),
});

const fileUpdateSchema = z.object({
  content: z
    .string()
    .max(10 * 1024 * 1024, 'File size exceeds 10MB limit'),
  language: z
    .enum([
      'javascript',
      'typescript',
      'python',
      'java',
      'cpp',
      'csharp',
      'ruby',
      'go',
      'rust',
      'html',
      'css',
      'sql',
      'json',
      'xml',
      'yaml',
    ])
    .optional(),
});

// User Schemas
const userUpdateSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
});

// Pagination Schema
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Invite Schema
const inviteSchema = z.object({
  email: emailSchema,
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
  paginationSchema,
  inviteSchema,
};
