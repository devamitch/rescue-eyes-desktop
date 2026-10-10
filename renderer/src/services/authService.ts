import { URLS } from '@/constants/urls';
import api from '../api';
import { AuthResponse, Login, UpdatePassword } from '../schema/auth';

// Login User
export const loginUser = async (data: Login): Promise<AuthResponse> => {
	const response = await api.post<Login, { data: AuthResponse }>(URLS.login, data);
	return response.data;
};

// Update Password
export const updatePassword = async (data: UpdatePassword): Promise<void> => {
	await api.post<UpdatePassword, void>(URLS.updatePassword, data);
};
