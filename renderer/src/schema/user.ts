import { z } from 'zod';

export const UserRoleSchema = z.enum(['ADMIN', 'USER']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const ActiveStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);
export type ActiveStatus = z.infer<typeof ActiveStatusSchema>;

export const CreateUserSchema = z
	.object({
		name: z.string().optional(),
		email: z.string().email().optional(),
		password: z.string().optional(),
		role: UserRoleSchema.optional(),
		profilePhoto: z.string().url().optional(),
		bio: z.string().optional(),
		address: z.string().optional(),
		mobileNumber: z.string().optional(),
		activeStatus: ActiveStatusSchema.optional(),
	})
	.partial();

export const UpdateUserSchema = z
	.object({
		name: z.string().optional(),
		email: z.string().email().optional(),
		password: z.string().optional(),
		role: UserRoleSchema.optional(),
		profilePhoto: z.string().url().optional(),
		bio: z.string().optional(),
		address: z.string().optional(),
		mobileNumber: z.string().optional(),
		activeStatus: ActiveStatusSchema.optional(),
	})
	.partial();

export const UserResponseSchema = z
	.object({
		id: z.string().uuid().optional(),
		name: z.string().optional(),
		email: z.string().email().optional(),
		password: z.string().optional(),
		profilePhoto: z.string().url().optional(),
		bio: z.string().optional(),
		address: z.string().nullable().optional(),
		activeStatus: ActiveStatusSchema.optional(),
		role: UserRoleSchema.optional(),
		mobileNumber: z.string().nullable().optional(),
		createdAt: z.string().datetime().optional(),
		updatedAt: z.string().datetime().optional(),
	})
	.partial();

export const UsersListResponseSchema = z.array(UserResponseSchema);

export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;
