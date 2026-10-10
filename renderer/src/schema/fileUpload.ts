import { z } from 'zod';

export const FileUploadSchema = z
	.object({
		file: z.instanceof(File).optional(),
	})
	.partial();

export const MultipleFileUploadSchema = z
	.object({
		files: z.array(z.instanceof(File)).optional(),
	})
	.partial();

export const FileResponseSchema = z
	.object({
		fileName: z.string().optional(),
		url: z.string().url().optional(),
		size: z.number().optional(),
		mimetype: z.string().optional(),
		uploadedAt: z.string().datetime().optional(),
	})
	.partial();

export type FileUpload = z.infer<typeof FileUploadSchema>;
export type MultipleFileUpload = z.infer<typeof MultipleFileUploadSchema>;
export type FileResponse = z.infer<typeof FileResponseSchema>;
