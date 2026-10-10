"use client"

import { useRef, useState, useCallback, useEffect } from "react"

interface CameraState {
  isActive: boolean
  error: string | null
  stream: MediaStream | null
  permissionState: "prompt" | "granted" | "denied" | "checking"
}

interface CameraConfig {
  width?: number
  height?: number
  facingMode?: "user" | "environment"
}

const DEFAULT_CONFIG: Required<CameraConfig> = {
  width: 640,
  height: 480,
  facingMode: "user",
}

export const useCamera = (config: CameraConfig = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const videoRef = useRef<HTMLVideoElement>(null)

  const [state, setState] = useState<CameraState>({
    isActive: false,
    error: null,
    stream: null,
    permissionState: "prompt",
  })

  const checkPermissions = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser")
      }

      // Check if permissions API is available
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: "camera" as PermissionName })
        setState((prev) => ({ ...prev, permissionState: permission.state as any }))
        return permission.state
      }

      return "prompt"
    } catch (error) {
      console.error("Permission check failed:", error)
      return "prompt"
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, permissionState: "checking", error: null }))

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: finalConfig.width,
          height: finalConfig.height,
          facingMode: finalConfig.facingMode,
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await new Promise<void>((resolve) => {
          const video = videoRef.current!
          const onLoadedMetadata = () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata)
            resolve()
          }
          video.addEventListener("loadedmetadata", onLoadedMetadata)
        })
      }

      setState({
        isActive: true,
        error: null,
        stream,
        permissionState: "granted",
      })

      return stream
    } catch (error) {
      let errorMessage = "Camera access failed"

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Camera permission denied. Please allow camera access and try again."
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera found. Please connect a camera and try again."
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application."
        } else if (error.name === "OverconstrainedError") {
          errorMessage = "Camera doesn't support the requested settings."
        } else {
          errorMessage = `Camera error: ${error.message}`
        }
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isActive: false,
        permissionState: error instanceof Error && error.name === "NotAllowedError" ? "denied" : "prompt",
      }))

      throw new Error(errorMessage)
    }
  }, [finalConfig.width, finalConfig.height, finalConfig.facingMode])

  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop())
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setState((prev) => ({
      ...prev,
      isActive: false,
      stream: null,
    }))
  }, [state.stream])

  useEffect(() => {
    checkPermissions()
  }, [checkPermissions])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    ...state,
    videoRef,
    startCamera,
    stopCamera,
    checkPermissions,
    config: finalConfig,
  }
}
