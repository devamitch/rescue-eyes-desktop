import { z } from 'zod';

export const HoursSchema = z
	.object({
		Monday: z.string().optional(),
		Tuesday: z.string().optional(),
		Wednesday: z.string().optional(),
		Thursday: z.string().optional(),
		Friday: z.string().optional(),
		Saturday: z.string().optional(),
		Sunday: z.string().optional(),
	})
	.partial();

export const CreateEyeSpecialistSchema = z
	.object({
		name: z.string().optional(),
		description: z.string().optional(),
		photos: z.array(z.string().url()).optional(),
		rating: z.number().optional(),
		reviewCount: z.number().optional(),
		website: z.string().url().optional(),
		contact: z.string().optional(),
		address: z.string().optional(),
		mapLink: z.string().url().optional(),
		hours: HoursSchema.optional(),
	})
	.partial();

export const UpdateEyeSpecialistSchema = CreateEyeSpecialistSchema;

export const EyeSpecialistResponseSchema = z
	.object({
		id: z.string().uuid().optional(),
		name: z.string().optional(),
		description: z.string().optional(),
		photos: z.array(z.string().url()).optional(),
		rating: z.number().optional(),
		reviewCount: z.number().optional(),
		website: z.string().url().optional(),
		contact: z.string().optional(),
		address: z.string().optional(),
		mapLink: z.string().url().optional(),
		hours: HoursSchema.optional(),
		createdAt: z.string().datetime().optional(),
		updatedAt: z.string().datetime().optional(),
	})
	.partial();

export const EyeSpecialistsListSchema = z.array(EyeSpecialistResponseSchema);

export type CreateEyeSpecialist = z.infer<typeof CreateEyeSpecialistSchema>;
export type UpdateEyeSpecialist = z.infer<typeof UpdateEyeSpecialistSchema>;
export type EyeSpecialistResponse = z.infer<typeof EyeSpecialistResponseSchema>;
export type EyeSpecialistsList = z.infer<typeof EyeSpecialistsListSchema>;
export type Hours = z.infer<typeof HoursSchema>;
