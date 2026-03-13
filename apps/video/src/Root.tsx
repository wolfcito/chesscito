import React from "react";
import { Composition } from "remotion";
import { ChesscitPromo } from "./ChesscitPromo";

const FPS = 30;
const DURATION_FRAMES = 660; // ~22s at 30fps (will be updated after transitions)

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ChesscitPromo"
      component={ChesscitPromo}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
