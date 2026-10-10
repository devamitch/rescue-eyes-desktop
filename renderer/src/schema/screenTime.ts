import { z } from 'zod';

export const CreateScreenTimeSchema = z
	.object({
		session_start: z.union([z.string().datetime(), z.date()]).optional(),
		session_end: z.union([z.string().datetime(), z.date()]).optional(),
		duration: z.number().optional(),
	})
	.partial();

export const ScreenTimeResponseSchema = z
	.object({
		id: z.string().uuid().optional(),
		userId: z.string().uuid().optional(),
		session_start: z.string().datetime().optional(),
		session_end: z.string().datetime().optional(),
		duration: z.number().optional(),
		createdAt: z.string().datetime().optional(),
		updatedAt: z.string().datetime().optional(),
	})
	.partial();

export const ScreenTimeListSchema = z.array(ScreenTimeResponseSchema);

export type CreateScreenTime = z.infer<typeof CreateScreenTimeSchema>;
export type ScreenTimeResponse = z.infer<typeof ScreenTimeResponseSchema>;
export type ScreenTimeList = z.infer<typeof ScreenTimeListSchema>;
