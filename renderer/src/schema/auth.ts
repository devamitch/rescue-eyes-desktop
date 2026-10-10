import { z } from 'zod';

export const LoginSchema = z
	.object({
		email: z.string().email().optional(),
		password: z.string().optional(),
	})
	.partial();

export const UpdatePasswordSchema = z
	.object({
		email: z.string().email().optional(),
		oldpassword: z.string().optional(),
		newpassword: z.string().optional(),
	})
	.partial();

export const AuthResponseSchema = z
	.object({
		name: z.string().optional(),
		role: z.enum(['ADMIN', 'USER']).optional(),
		email: z.string().email().optional(),
		id: z.string().uuid().optional(),
		profilePhoto: z.string().url().optional(),
		token: z.string().optional(),
	})
	.partial();

export type Login = z.infer<typeof LoginSchema>;
export type UpdatePassword = z.infer<typeof UpdatePasswordSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
