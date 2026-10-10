import { URLS } from '@/constants/urls';
import api from '../api';
import {
	CreateEyeExercise,
	CreateUserExerciseMap,
	EyeExerciseResponse,
	EyeExercisesList,
	UpdateEyeExercise,
	UserExerciseMapResponse,
	UserExerciseMapsList,
} from '../schema/eyeExercises';

// Create Eye Exercise
export const createEyeExercise = async (data: CreateEyeExercise): Promise<EyeExerciseResponse> => {
	const response = await api.post<CreateEyeExercise, { data: EyeExerciseResponse }>(
		URLS.eyeExercises,
		data
	);
	return response.data;
};

// Get All Eye Exercises
export const getAllEyeExercises = async (): Promise<EyeExercisesList> => {
	const response = await api.get<EyeExercisesList>(URLS.eyeExercises);
	return response.data;
};

// Get Eye Exercise By ID
export const getEyeExerciseById = async (id: string): Promise<EyeExerciseResponse> => {
	const response = await api.get<EyeExerciseResponse>(URLS.eyeExercises.byId(id));
	return response.data;
};

// Update Eye Exercise
export const updateEyeExercise = async (
	id: string,
	data: Partial<UpdateEyeExercise>
): Promise<EyeExerciseResponse> => {
	const response = await api.patch<Partial<UpdateEyeExercise>, { data: EyeExerciseResponse }>(
		URLS.eyeExercises.byId(id),
		data
	);
	return response.data;
};

// Delete Eye Exercise
export const deleteEyeExercise = async (id: string): Promise<void> => {
	await api.delete(URLS.eyeExercises.byId(id));
};

// Create User Exercise Map
export const createUserExerciseMap = async (
	data: CreateUserExerciseMap
): Promise<UserExerciseMapResponse> => {
	const response = await api.post<CreateUserExerciseMap, { data: UserExerciseMapResponse }>(
		URLS.userExerciseMap,
		data
	);
	return response.data;
};

// Get All User Exercise Maps
export const getAllUserExerciseMaps = async (): Promise<UserExerciseMapsList> => {
	const response = await api.get<UserExerciseMapsList>(URLS.userExerciseMap);
	return response.data;
};
