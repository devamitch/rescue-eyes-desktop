import { URLS } from '@/constants/urls';
import api from '../api';
import { CreateUser, UpdateUser, UserResponse, UsersListResponse } from '../schema/user';

// Create User
export const createUser = async (data: CreateUser): Promise<UserResponse> => {
	const response = await api.post<CreateUser, { data: UserResponse }>(URLS.register, data);
	return response.data;
};

// Get All Users
export const getAllUsers = async (): Promise<UsersListResponse> => {
	const response = await api.get<UsersListResponse>(URLS.users);
	return response.data;
};

// Get User By ID
export const getUserById = async (id: string): Promise<UserResponse> => {
	const response = await api.get<UserResponse>(URLS.users.byId(id));
	return response.data;
};

// Update User
export const updateUser = async (id: string, data: Partial<UpdateUser>): Promise<UserResponse> => {
	const response = await api.patch<Partial<UpdateUser>, { data: UserResponse }>(
		URLS.users.byId(id),
		data
	);
	return response.data;
};

// Delete User
export const deleteUser = async (id: string): Promise<void> => {
	await api.delete(URLS.users.byId(id));
};
