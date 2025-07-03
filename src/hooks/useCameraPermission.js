import { useEffect, useState } from "react";

export function useCameraPermission() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: "camera" });
          setStatus(result.state);

          // Listen for future changes (optional)
          result.onchange = () => setStatus(result.state);
        } else {
          // Fallback: try accessing the camera
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            setStatus("granted");
            stream.getTracks().forEach((track) => track.stop());
          } catch (err) {
            if (err.name === "NotAllowedError") {
              setStatus("denied");
            } else if (err.name === "NotFoundError") {
              setStatus("error"); // no camera found
            } else {
              setStatus("error");
            }
          }
        }
      } catch {
        setStatus("unsupported");
      }
    };

    checkPermission();
  }, []);

  return status;
}
