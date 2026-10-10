// import { RefObject, useEffect } from 'react';

// export const useVideoSync = (
// 	videoRef: RefObject<HTMLVideoElement>,
// 	canvasRef: RefObject<HTMLCanvasElement>,
// 	isVideoReady: boolean
// ) => {
// 	useEffect(() => {
// 		const video = videoRef?.current;
// 		const canvas = canvasRef?.current;

// 		if (video && canvas && isVideoReady) {
// 			if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
// 				canvas.width = video.videoWidth;
// 				canvas.height = video.videoHeight;
// 			}
// 		}
// 	}, [videoRef, canvasRef, isVideoReady]);
// };

import { RefObject, useEffect } from 'react';

export const useVideoSync = (
	videoRef: RefObject<HTMLVideoElement>,
	canvasRef: RefObject<HTMLCanvasElement>,
	isVideoReady: boolean
) => {
	useEffect(() => {
		const video = videoRef?.current;
		const canvas = canvasRef?.current;

		if (video && canvas && isVideoReady) {
			if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
			}
		}
	}, [videoRef, canvasRef, isVideoReady]);
};
