import { z } from 'zod';

export const TOKELESS_URLS = {
	login: '/auth/login',
	register: '/users',
	updatePassword: '/auth/update-password',
} as const;

export const STATIC_URLS = {
	users: '/users',
	eyeTracking: '/eyetracking',
	eyeTrackingTimeFilter: '/eyetracking/time-filter',
	eyeProducts: '/eye-products',
	eyeExercises: '/eye-excercises',
	userExerciseMap: '/eye-excercises/user-excercise-map',
	screenTime: '/screentime',
	eyeSpecialists: '/eye-specialists',
	articles: '/articles',
	fileUpload: '/files/upload',
	multipleFileUpload: '/files/upload-multiple',
} as const;

const createDynamicUrl = <T extends string, ID extends z.infer<typeof IdSchema>>(base: T) => ({
	byId: (id: ID) => `${base}/${id}` as `${T}/${ID}`,
});

export const DYNAMIC_URLS = {
	users: createDynamicUrl('/users'),
	eyeProducts: createDynamicUrl('/eye-products'),
	eyeExercises: createDynamicUrl('/eye-excercises'),
	screenTimes: createDynamicUrl('/screentime'),
	eyeSpecialists: createDynamicUrl('/eye-specialists'),
	articles: createDynamicUrl('/articles'),
	files: createDynamicUrl('/files'),
} as const;

export const URLS = {
	...TOKELESS_URLS,
	...STATIC_URLS,
	...DYNAMIC_URLS,
} as const;

export const IdSchema = z.string().uuid();
export const NumberSchema = z.number();

export type URLS_TYPE = (typeof URLS)[keyof typeof URLS];
export type TOKELESS_URLS_TYPE = (typeof TOKELESS_URLS)[keyof typeof TOKELESS_URLS];
