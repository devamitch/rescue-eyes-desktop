import { z } from 'zod';

export const CreateEyeExerciseSchema = z
	.object({
		title: z.string().optional(),
		link: z.string().url().optional(),
	})
	.partial();

export const UpdateEyeExerciseSchema = CreateEyeExerciseSchema;

export const EyeExerciseResponseSchema = z
	.object({
		id: z.string().uuid().optional(),
		title: z.string().optional(),
		link: z.string().url().optional(),
		createdAt: z.string().datetime().optional(),
		updatedAt: z.string().datetime().optional(),
	})
	.partial();

export const EyeExercisesListSchema = z.array(EyeExerciseResponseSchema);

export const UserExerciseMapSchema = z
	.object({
		excercise_id: z.string().uuid().optional(),
		beforeMetrics: z.string().optional(), // JSON string
		afterMetrics: z.string().optional(), // JSON string
	})
	.partial();

export const CreateUserExerciseMapSchema = UserExerciseMapSchema;
export const UserExerciseMapResponseSchema = z
	.object({
		id: z.string().uuid().optional(),
		userId: z.string().uuid().optional(),
		excercise_id: z.string().uuid().optional(),
		beforeMetrics: z.string().optional(),
		afterMetrics: z.string().optional(),
		createdAt: z.string().datetime().optional(),
		updatedAt: z.string().datetime().optional(),
	})
	.partial();

export const UserExerciseMapsListSchema = z.array(UserExerciseMapResponseSchema);

export type CreateEyeExercise = z.infer<typeof CreateEyeExerciseSchema>;
export type UpdateEyeExercise = z.infer<typeof UpdateEyeExerciseSchema>;
export type EyeExerciseResponse = z.infer<typeof EyeExerciseResponseSchema>;
export type EyeExercisesList = z.infer<typeof EyeExercisesListSchema>;
export type CreateUserExerciseMap = z.infer<typeof CreateUserExerciseMapSchema>;
export type UserExerciseMapResponse = z.infer<typeof UserExerciseMapResponseSchema>;
export type UserExerciseMapsList = z.infer<typeof UserExerciseMapsListSchema>;
