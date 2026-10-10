import { URLS } from '@/constants/urls';
import api from '../api';
import { CreateScreenTime, ScreenTimeList, ScreenTimeResponse } from '../schema/screenTime';

// Create Screen Time
export const createScreenTime = async (data: CreateScreenTime): Promise<ScreenTimeResponse> => {
	const response = await api.post<CreateScreenTime, { data: ScreenTimeResponse }>(
		URLS.screenTime,
		data
	);
	return response.data;
};

// Get All Screen Times
export const getAllScreenTimes = async (): Promise<ScreenTimeList> => {
	const response = await api.get<ScreenTimeList>(URLS.screenTime);
	return response.data;
};

// Get Screen Time By ID
export const getScreenTimeById = async (id: string): Promise<ScreenTimeResponse> => {
	const response = await api.get<ScreenTimeResponse>(URLS.screenTimes.byId(id));
	return response.data;
};
