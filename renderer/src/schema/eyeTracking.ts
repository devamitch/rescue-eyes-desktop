import { z } from 'zod';

export const TimeIntervalSchema = z
	.enum([
		'1 second',
		'5 seconds',
		'10 seconds',
		'30 seconds',
		'1 minute',
		'5 minutes',
		'10 minutes',
		'30 minutes',
		'1 hour',
		'6 hours',
		'12 hours',
		'1 day',
		'1 month',
		'90 days',
		'7 days',
	])
	.optional();

export const TimeFilterSchema = z.enum(['weekly', 'monthly', 'yearly']).optional();

export const EyeTrackingMetricSchema = z
	.object({
		timestamp: z.union([z.string().datetime(), z.date()]).optional(),
		blinkRate: z.number().optional(),
		perClose: z.number().optional(),
		attentionFrac: z.number().optional(),
		strainLevelIdx: z.number().optional(),
		strainText: z.string().optional(),
		tiredText: z.string().optional(),
		attBinary: z.number().optional(),
		eyeAspectRatio: z.number().optional(),
		pupilDilation: z.number().optional(),
		squintIntensity: z.number().optional(),
		eyeAge: z.number().optional(),
		faceAge: z.number().optional(),
		age: z.number().optional(),
	})
	.partial();

export const CreateEyeTrackingMetricSchema = EyeTrackingMetricSchema;
export const UpdateEyeTrackingMetricSchema = EyeTrackingMetricSchema;

export const EyeTrackingMetricsListSchema = z.array(EyeTrackingMetricSchema);

export const TimeRangeParamsSchema = z
	.object({
		start: z.string().datetime().optional(),
		end: z.string().datetime().optional(),
		interval: TimeIntervalSchema,
	})
	.partial();

export const TimeFilterParamsSchema = z
	.object({
		timeFilter: TimeFilterSchema,
	})
	.partial();

export type EyeTrackingMetric = z.infer<typeof EyeTrackingMetricSchema>;
export type CreateEyeTrackingMetric = z.infer<typeof CreateEyeTrackingMetricSchema>;
export type UpdateEyeTrackingMetric = z.infer<typeof UpdateEyeTrackingMetricSchema>;
export type EyeTrackingMetricsList = z.infer<typeof EyeTrackingMetricsListSchema>;
export type TimeRangeParams = z.infer<typeof TimeRangeParamsSchema>;
export type TimeFilterParams = z.infer<typeof TimeFilterParamsSchema>;
