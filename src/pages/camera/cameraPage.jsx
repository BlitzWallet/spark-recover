import { useRef, useEffect, useState } from "react";
import QrScanner from "qr-scanner";

import "./camera.css";
import { Colors } from "../../constants/theme";
import flashLightNoFill from "../../assets/flashlightNoFillWhite.png";
import flashLightFill from "../../assets/flashlight.png";
import images from "../../assets/images.png";
import { useCameraPermission } from "../../hooks/useCameraPermission";
import BackArrow from "../../components/backArrow/backArrow";
import { handleQRSeed } from "../../functions/handleSeedPaste";

export default function Camera({ setUseCamera, setInputedKey, NUMARRAY }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const didScan = useRef(false);
  const fileInput = document.getElementById("file-selector");
  const [pauseCamera, setPauseCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFlashlightOn, setIsFlashLightOn] = useState(false);
  const cameraPermissions = useCameraPermission();

  useEffect(() => {
    if (pauseCamera || didScan.current || !videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        console.log(result, "result in camera scan");
        const data = result.data;
        if (!data) return;
        if (didScan.current) return;
        didScan.current = true;

        const seedArray = handleQRSeed(data);
        if (!seedArray.didWork) {
          didScan.current = false;
          return;
        }

        const newKeys = {};
        NUMARRAY.forEach((num, index) => {
          newKeys[`key${num}`] = seedArray.seed[index];
        });

        setInputedKey(newKeys);
        scanner.stop();
        setPauseCamera(true);
        setUseCamera(false);
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: false,
        highlightCodeOutline: false,
      }
    );

    scannerRef.current = scanner;

    scanner
      .start()
      .then(() => setIsCameraReady(true))
      .catch((err) => {
        console.error("Failed to start scanner:", err);
        setIsCameraReady(false);
      });

    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [pauseCamera]);

  const toggleFlashLight = async () => {
    try {
      const hasFlash = await scannerRef.current.hasFlash();
      if (!hasFlash) {
        return;
      }
      await scannerRef.current.toggleFlash();
      const isFlashOn = scannerRef.current.isFlashOn();
      setIsFlashLightOn(isFlashOn);
    } catch (err) {
      console.log("camera flash error", err);
    }
  };

  const fileListener = () => {
    const file = fileInput.files[0];

    if (!file) {
      return;
    }
    QrScanner.scanImage(file, { returnDetailedScanResult: true })
      .then((result) => {
        console.log(result, "result from file listener");
        const data = result.data;
        if (!data) return;
        if (didScan.current) return;
        didScan.current = true;

        const seedArray = handleQRSeed(data);
        if (!seedArray.didWork) return;

        const newKeys = {};
        NUMARRAY.forEach((num, index) => {
          newKeys[`key${num}`] = seedArray.seed[index];
        });

        setInputedKey(newKeys);
        setUseCamera(false);

        fileInput.removeEventListener("change", fileListener);
      })
      .catch((e) => {
        fileInput.removeEventListener("change", fileListener);
      });
  };
  const getDataFromFile = async () => {
    try {
      fileInput.addEventListener("change", fileListener);
      fileInput.click();
    } catch (err) {
      console.log("camera flash error", err);
    }
  };

  return (
    <div className="camera-page">
      <div className="backContainer">
        <BackArrow goBackState={() => setUseCamera(false)} showWhite={true} />
      </div>
      <div id="video-container" className="example-style-2">
        <video
          ref={videoRef}
          className="camera-video"
          disablePictureInPicture
          playsInline
          muted
          style={{ width: "100%" }}
        />
        <div
          className="scan-region-highlight"
          style={{
            border: `4px solid ${Colors.light.blue}`,
          }}
        >
          {!isCameraReady && (
            <p>
              {cameraPermissions === "denied"
                ? "To use this feature, enable camera in the browser settings."
                : "Loading camera..."}
            </p>
          )}
        </div>
      </div>
      <div onClick={getDataFromFile} className="fileContainer">
        <input hidden type="file" id="file-selector" accept="image/*" />
        <img className="optionImage" src={images} alt="images icon" />
      </div>
      <div onClick={toggleFlashLight} className="flashLightContainer">
        <img
          className="optionImage"
          src={isFlashlightOn ? flashLightFill : flashLightNoFill}
          alt="flash light icon"
        />
      </div>
      <button>Paste</button>
      {/* <CustomButton
        actionFunction={handlePaste}
        textContent={"Paste"}
        buttonClassName={"handleCameraPaste"}
        textClassName={"handleCameraPasteText"}
      /> */}
    </div>
  );
}
