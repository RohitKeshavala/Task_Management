import { z } from 'zod';

export * from './errors.js';
export * from './auth.js';

export type UserRole = 'ADMIN' | 'MEMBER' | 'VIEWER';
export const VALID_USER_ROLES: readonly UserRole[] = ['ADMIN', 'MEMBER', 'VIEWER'] as const;

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  dependsOnTaskIds?: string[];
}

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).default(''),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const CreateTaskSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(1000).default(''),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  dueDate: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  dependsOnTaskIds: z.array(z.string()).optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  dueDate: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  dependsOnTaskIds: z.array(z.string()).optional(),
});

export const CreateTagSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required').max(50),
  color: z.string().trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be a valid hex color (e.g. #3b82f6)')
    .transform(c => {
      if (c.length === 4) {
        return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`.toLowerCase();
      }
      return c.toLowerCase();
    })
    .default('#6366f1'),
});

export const AssociateTagSchema = z.object({
  tagId: z.string().trim().min(1, 'Tag ID is required').optional(),
  id: z.string().trim().min(1, 'Tag ID is required').optional(),
}).refine(data => {
  const val = data.tagId || data.id;
  return typeof val === 'string' && val.trim().length > 0;
}, {
  message: 'tagId is required',
  path: ['tagId'],
});

export const AddDependencySchema = z.object({
  dependsOnTaskId: z.string().trim().min(1, 'dependsOnTaskId is required').optional(),
  id: z.string().trim().min(1).optional(),
}).refine(data => {
  const val = data.dependsOnTaskId || data.id;
  return typeof val === 'string' && val.trim().length > 0;
}, {
  message: 'dependsOnTaskId is required',
  path: ['dependsOnTaskId'],
});
