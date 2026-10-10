import { URLS } from '@/constants/urls';
import api from '../api';
import {
	CreateEyeTrackingMetric,
	EyeTrackingMetricsList,
	TimeFilterParams,
	TimeRangeParams,
} from '../schema/eyeTracking';

// Create Eye Tracking Metrics
export const createEyeTrackingMetrics = async (
	data: CreateEyeTrackingMetric[]
): Promise<EyeTrackingMetricsList> => {
	const response = await api.post<CreateEyeTrackingMetric[], { data: EyeTrackingMetricsList }>(
		URLS.eyeTracking,
		data
	);
	return response.data;
};

// Get Eye Tracking Metrics
export const getEyeTrackingMetrics = async (
	params: TimeRangeParams
): Promise<EyeTrackingMetricsList> => {
	const response = await api.get<EyeTrackingMetricsList>(URLS.eyeTracking, { params });
	return response.data;
};

// Get Filtered Eye Tracking Metrics
export const getFilteredEyeTrackingMetrics = async (
	params: TimeFilterParams
): Promise<EyeTrackingMetricsList> => {
	const response = await api.get<EyeTrackingMetricsList>(URLS.eyeTrackingTimeFilter, { params });
	return response.data;
};
