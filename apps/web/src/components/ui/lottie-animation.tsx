"use client";

import { useEffect, useRef } from "react";
import Lottie from "lottie-react";
import type { LottieRefCurrentProps } from "lottie-react";

type Props = {
  animationData: unknown;
  loop?: boolean;
  speed?: number;
  className?: string;
};

export function LottieAnimation({ animationData, loop = true, speed = 1, className }: Props) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (lottieRef.current && speed !== 1) {
      lottieRef.current.setSpeed(speed);
    }
  }, [speed]);

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={loop}
      className={className}
      rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
    />
  );
}
