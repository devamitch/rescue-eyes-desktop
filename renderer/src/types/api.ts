export interface User {
	id: string;
	name: string;
	email: string;
	password: string;
	profilePhoto?: string;
	bio?: string;
	address?: string;
	activeStatus: 'ACTIVE' | 'INACTIVE';
	role: 'USER' | 'ADMIN';
	mobileNumber?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateUserDto {
	name: string;
	email: string;
	password: string;
}

export interface UpdateUserDto {
	bio?: string;
	profilePhoto?: string;
	mobileNumber?: string;
	role?: 'USER' | 'ADMIN';
}

export interface AuthEmailLoginDto {
	email: string;
	password: string;
}

export interface UpdatePasswordDto {
	email: string;
	oldpassword: string;
	newpassword: string;
}

export interface LoginResponse {
	role: string;
	email: string;
	id: string;
	token: string;
}

export interface EyetrackingMetric {
	timestamp: string;
	blinkRate: number;
	perClose: number;
	attentionFrac: number;
	strainLevelIdx: number;
	strainText: string;
	tiredText: string;
	attBinary: number;
	eyeAspectRatio: number;
	pupilDilation: number;
	squintIntensity: number;
	eyeAge: number;
	faceAge: number;
	age: number;
}

export type CreateEyetrackingMetricDto = EyetrackingMetric & {};

export interface EyetrackingAggregatedData {
	interval: string;
	totalBlinks: number;
	totalAttention: number;
	averageStrain: number;
	maxEyeAge: number;
}

export interface EyetrackingQueryParams {
	start: string;
	end: string;
	interval: string;
}

export type TimeFilter = 'weekly' | 'monthly' | 'yearly';

export interface Screentime {
	id: string;
	user_id: string;
	session_start: string;
	session_end: string;
	duration: number;
}

export interface CreateScreentimeDto {
	session_start: string;
	session_end: string;
	duration: number;
}

// Common API Response Types
export interface ApiResponse<T = any> {
	data: T;
	message?: string;
	status: number;
}

export interface ApiError {
	message: string;
	status: number;
	error?: string;
}

// Request/Response wrapper types
export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface QueryParams {
	page?: number;
	limit?: number;
	sort?: string;
	order?: 'asc' | 'desc';
}

// WebSocket types
export interface SocketEvent<T = any> {
	type: string;
	payload: T;
	timestamp: string;
}

export interface SocketConnection {
	userId: string;
	socketId: string;
	connectedAt: string;
}

// Authentication context types
export interface AuthUser {
	id: string;
	email: string;
	role: string;
	token: string;
}

export interface AuthState {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}
