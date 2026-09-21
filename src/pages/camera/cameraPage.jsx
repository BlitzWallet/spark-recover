import { useCallback, useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { useCameraPermission } from "../../hooks/useCameraPermission";
import "./camera.css";

export default function Camera({ mode, title, description, onScan, onClose }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const didScanRef = useRef(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [scanError, setScanError] = useState("");
  const cameraPermission = useCameraPermission();

  const processScan = useCallback(
    (data) => {
      if (!data || didScanRef.current) return false;
      const didAccept = onScan(data);
      if (!didAccept) {
        setScanError(
          mode === "seed"
            ? "This QR code is not a supported recovery backup."
            : "This QR code does not contain a usable destination.",
        );
        return false;
      }

      didScanRef.current = true;
      scannerRef.current?.stop();
      onClose();
      return true;
    },
    [mode, onClose, onScan],
  );

  useEffect(() => {
    if (!videoRef.current) return undefined;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => processScan(result.data),
      {
        returnDetailedScanResult: true,
        highlightScanRegion: false,
        highlightCodeOutline: false,
      },
    );
    scannerRef.current = scanner;

    scanner
      .start()
      .then(() => setIsCameraReady(true))
      .catch(() => {
        setScanError(
          cameraPermission === "denied"
            ? "Camera access is blocked. Enable it in browser settings or choose a QR image."
            : "We could not open the camera. Choose a QR image instead.",
        );
      });

    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [cameraPermission, processScan]);

  return (
    <main className="cameraPage">
      <div className="cameraTopBar">
        <button className="cameraBack" type="button" onClick={onClose}>
          <span aria-hidden="true">←</span>
        </button>
      </div>

      <video
        ref={videoRef}
        className="cameraVideo"
        disablePictureInPicture
        playsInline
        muted
      />
      <div className="cameraMask" aria-hidden="true">
        <div className="cameraFrame" />
      </div>
    </main>
  );
}
