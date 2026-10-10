import { URLS } from '@/constants/urls';
import api from '../api';
import {
	CreateEyeProduct,
	EyeProductResponse,
	EyeProductsList,
	UpdateEyeProduct,
} from '../schema/eyeProducts';

// Create Eye Product
export const createEyeProduct = async (data: CreateEyeProduct): Promise<EyeProductResponse> => {
	const response = await api.post<CreateEyeProduct, { data: EyeProductResponse }>(
		URLS.eyeProducts,
		data
	);
	return response.data;
};

// Get All Eye Products
export const getAllEyeProducts = async (): Promise<EyeProductsList> => {
	const response = await api.get<EyeProductsList>(URLS.eyeProducts);
	return response.data;
};

// Get Eye Product By ID
export const getEyeProductById = async (id: string): Promise<EyeProductResponse> => {
	const response = await api.get<EyeProductResponse>(URLS.eyeProducts.byId(id));
	return response.data;
};

// Update Eye Product
export const updateEyeProduct = async (
	id: string,
	data: Partial<UpdateEyeProduct>
): Promise<EyeProductResponse> => {
	const response = await api.patch<Partial<UpdateEyeProduct>, { data: EyeProductResponse }>(
		URLS.eyeProducts.byId(id),
		data
	);
	return response.data;
};

// Delete Eye Product
export const deleteEyeProduct = async (id: string): Promise<void> => {
	await api.delete(URLS.eyeProducts.byId(id));
};
