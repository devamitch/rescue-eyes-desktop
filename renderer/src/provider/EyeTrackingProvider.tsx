'use client';

import { EyeMetrics, useEyeTracking } from '@/hooks/useEyeTracking';
import { EyeTrackingMetrics } from '@/store/slices/eye-tracking.slice';
import React, { createContext, ReactNode, useContext } from 'react';

interface EyeTrackingContextType {
	videoRef: React.RefObject<HTMLVideoElement | null>;
	canvasRef: React.RefObject<HTMLCanvasElement | null>;
	metrics: EyeTrackingMetrics;
	error: string | null;
	isActive: boolean;
	cameraReady: boolean;
	streamData: EyeMetrics[];
	loading: boolean;
	startTracking: () => Promise<() => void>;
	stopTracking: (opts?: { preserveIntent?: boolean }) => void;
	getMetricsHistory: () => EyeTrackingMetrics[] | undefined;
	getStreamData: () => EyeMetrics[];
	isInitialized: boolean;
	stream: MediaStream | null;
}

const EyeTrackingContext = createContext<EyeTrackingContextType | undefined>(undefined);

export const useEyeTrackingContext = () => {
	const context = useContext(EyeTrackingContext);
	if (context === undefined) {
		throw new Error('useEyeTrackingContext must be used within an EyeTrackingProvider');
	}
	return context;
};

interface EyeTrackingProviderProps {
	children: ReactNode;
}

export const EyeTrackingProvider: React.FC<EyeTrackingProviderProps> = ({ children }) => {
	const eyeTracking = useEyeTracking();

	return (
		<EyeTrackingContext.Provider value={eyeTracking}>{children}</EyeTrackingContext.Provider>
	);
};
