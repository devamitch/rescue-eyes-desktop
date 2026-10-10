import { z } from 'zod';

export const CreateEyeProductSchema = z
	.object({
		title: z.string().optional(),
		subTitle: z.string().optional(),
		image: z.string().url().optional(),
		description: z.string().optional(),
		link: z.string().url().optional(),
	})
	.partial();

export const UpdateEyeProductSchema = CreateEyeProductSchema;

export const EyeProductResponseSchema = z
	.object({
		id: z.string().uuid().optional(),
		title: z.string().optional(),
		subTitle: z.string().optional(),
		image: z.string().url().optional(),
		description: z.string().optional(),
		link: z.string().url().optional(),
		createdAt: z.string().datetime().optional(),
		updatedAt: z.string().datetime().optional(),
	})
	.partial();

export const EyeProductsListSchema = z.array(EyeProductResponseSchema);

export type CreateEyeProduct = z.infer<typeof CreateEyeProductSchema>;
export type UpdateEyeProduct = z.infer<typeof UpdateEyeProductSchema>;
export type EyeProductResponse = z.infer<typeof EyeProductResponseSchema>;
export type EyeProductsList = z.infer<typeof EyeProductsListSchema>;
