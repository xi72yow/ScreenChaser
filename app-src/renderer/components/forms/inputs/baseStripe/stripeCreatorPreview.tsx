import React, { useRef, useEffect, useState } from "react";
import { reScale } from "../../../effects_build/basics/reScale";

export default function StripeCreatorPreview({ frames, form }) {
  const canvasRef = useRef(null);
  const [context, setContext] = useState(null);

  const pixelSize = 10;

  const renderInterval = useRef(null);

  const draw = (frameCount) => {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.beginPath();
    for (let i = 0; i < form.values.device.neoPixelCount; i++) {
      context.fillStyle = frames[frameCount][i];

      context.fillRect(i * pixelSize * 1.1, 0, pixelSize, pixelSize);
    }
    context.fill();
  };

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      setContext(ctx);
    }
  }, []);

  useEffect(() => {
    let frameCount = 0;

    clearInterval(renderInterval.current);

    if (context && frames) {
      const render = () => {
        renderInterval.current = setInterval(() => {
          draw(frameCount);
          if (frameCount === frames.length - 1) {
            frameCount = 0;
          } else frameCount++;
        }, 1000 / form.values.animation?.fps || 1);
      };
      render();
    }
    return () => {
      clearInterval(renderInterval.current);
    };
  }, [draw, context, frames]);

  return (
    <canvas
      ref={canvasRef}
      width={form.values.device.neoPixelCount * pixelSize * 1.1}
      height={pixelSize}
    />
  );
}
