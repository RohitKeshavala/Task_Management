import { z } from 'zod';
import { UserRole } from './index.js';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithCredentials extends User {
  passwordHash: string;
  salt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const RegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'] as const).optional().default('MEMBER'),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'] as const, {
    errorMap: () => ({ message: "Role must be 'ADMIN', 'MEMBER', or 'VIEWER'" }),
  }),
});

export type UpdateUserRoleDto = z.infer<typeof UpdateUserRoleSchema>;

