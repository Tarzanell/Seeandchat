import React from "react";

function Token({ token, positionStyle }) {
  return (
    <div
      style={{
        width: "50px",
        height: "50px",
        position: "absolute",
        ...positionStyle
      }}
    >
      <img
        src={`http://217.154.16.188:3001/uploads/tokens/${token.immagine}`}
        alt="token"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

export default Token;