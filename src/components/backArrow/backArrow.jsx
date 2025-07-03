import backArrowIcon from "../../assets/arrow-left-blue.png";
import backArrowWhiteIcon from "../../assets/arrow-small-left-white.png";

import "./style.css";

export default function BackArrow({ goBackState, showWhite = false }) {
  return (
    <div
      onClick={() => {
        goBackState();
      }}
      className="backArrowContainer"
    >
      <img src={showWhite ? backArrowWhiteIcon : backArrowIcon} />
    </div>
  );
}
