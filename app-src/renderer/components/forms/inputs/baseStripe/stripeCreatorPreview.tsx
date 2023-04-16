import React, { useEffect, useRef, useState } from "react";

export default function StripeCreatorPreview({ data }) {
  const canvasRef = useRef(null);
  const [context, setContext] = useState(null);

  const pixelSize = 10;

  const renderInterval = useRef(null);

  const draw = (frameCount) => {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.beginPath();
    for (let i = 0; i < data[0].length; i++) {
      context.fillStyle = data[frameCount][i];

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

    if (context && data) {
      const render = () => {
        renderInterval.current = setInterval(() => {
          draw(frameCount);
          if (frameCount === data.length - 1) {
            frameCount = 0;
          } else frameCount++;
        }, 1500);
      };
      render();
    }
    return () => {
      clearInterval(renderInterval.current);
    };
  }, [draw, context, data]);

  return (
    <React.Fragment>
      <canvas
        ref={canvasRef}
        width={data[0].length * pixelSize * 1.1}
        height={pixelSize}
        hidden={false}
      />
    </React.Fragment>
  );
}
