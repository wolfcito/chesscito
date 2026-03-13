import React from "react";
import { AbsoluteFill } from "remotion";

export const ChesscitPromo: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0f1a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ color: "white", fontSize: 48 }}>Chesscito Promo</div>
    </AbsoluteFill>
  );
};
