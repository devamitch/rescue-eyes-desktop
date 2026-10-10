import { useCallback, useRef } from 'react';

// Type definitions
export const useBackgroundTracking = () => {
	const wakeLockRef = useRef<any>(null);
	const mediaKeepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const acquireWakeLock = useCallback(async () => {
		if ('wakeLock' in navigator) {
			try {
				wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
				console.log('Screen Wake Lock acquired for background tracking');
			} catch (err: any) {
				console.warn(`Screen Wake Lock error: ${err.message}`);
			}
		}
	}, []);

	const releaseWakeLock = useCallback(async () => {
		if (wakeLockRef.current) {
			await wakeLockRef.current.release();
			wakeLockRef.current = null;
			console.log('Screen Wake Lock released');
		}
	}, []);

	const keepMediaAlive = useCallback((mediaStream: MediaStream | null) => {
		if (!mediaStream) return;

		// Clear any existing interval
		if (mediaKeepAliveIntervalRef.current) {
			clearInterval(mediaKeepAliveIntervalRef.current);
		}

		const videoTracks = mediaStream.getVideoTracks();
		if (videoTracks.length === 0) return;

		// Periodic reactivation (every 15 seconds for background)
		mediaKeepAliveIntervalRef.current = setInterval(() => {
			videoTracks.forEach((track) => {
				if (track.readyState === 'live' && !track.enabled) {
					track.enabled = true;
					console.log('Reactivated video track in background');
				}
			});
		}, 15000);
	}, []);

	const stopMediaKeepAlive = useCallback(() => {
		if (mediaKeepAliveIntervalRef.current) {
			clearInterval(mediaKeepAliveIntervalRef.current);
			mediaKeepAliveIntervalRef.current = null;
		}
	}, []);

	return {
		acquireWakeLock,
		releaseWakeLock,
		keepMediaAlive,
		stopMediaKeepAlive,
	};
};

/**
 * const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
 
  // Background tracking
  const { acquireWakeLock, releaseWakeLock, keepMediaAlive, stopMediaKeepAlive } =
    useBackgroundTracking();

    startCamera has acquireWakeLock
    stopCAMERA has releaseWakeLock and stopMediaKeepAlive
    useEffect to call keepMediaAlive when mediaStream changes

  useEffect(() => {
    if (mediaStream) {
      keepMediaAlive(mediaStream);
    } else {
      stopMediaKeepAlive();
    }
  }
 * 
 * **/
