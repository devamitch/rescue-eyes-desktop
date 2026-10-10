import { z } from 'zod';

export const CreateArticleSchema = z
	.object({
		title: z.string().optional(),
		content: z.string().optional(),
		summary: z.string().optional(),
		images: z.array(z.string().url()).optional(),
		tags: z.array(z.string()).optional(),
		category: z.string().optional(),
		author: z.string().optional(),
		publishedAt: z.union([z.string().datetime(), z.date()]).optional(),
	})
	.partial();

export const UpdateArticleSchema = CreateArticleSchema;

export const ArticleResponseSchema = z
	.object({
		id: z.string().uuid().optional(),
		title: z.string().optional(),
		content: z.string().optional(),
		summary: z.string().optional(),
		images: z.array(z.string().url()).optional(),
		tags: z.array(z.string()).optional(),
		category: z.string().optional(),
		author: z.string().optional(),
		publishedAt: z.string().datetime().optional(),
		createdAt: z.string().datetime().optional(),
		updatedAt: z.string().datetime().optional(),
	})
	.partial();

export const ArticlesListSchema = z.array(ArticleResponseSchema);

export type CreateArticle = z.infer<typeof CreateArticleSchema>;
export type UpdateArticle = z.infer<typeof UpdateArticleSchema>;
export type ArticleResponse = z.infer<typeof ArticleResponseSchema>;
export type ArticlesList = z.infer<typeof ArticlesListSchema>;
