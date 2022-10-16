import { Group } from "@mantine/core";
import React, { useRef, useEffect } from "react";

const Canvas = (props) => {
  const canvasRef = useRef(null);
  const canvasWidth = window.innerWidth - window.innerWidth * 0.1;
  const PIX_COUNT = 115;
  const cellPixelLength = canvasWidth / PIX_COUNT;
  const canvasHeight = canvasWidth / PIX_COUNT;
  console.log(props.path);

  const [baseStripe, setBaseStripe] = React.useState(
    Array(PIX_COUNT).fill("#000000")
  );

  useEffect(() => {
    props.form.setFieldValue(props.path, baseStripe);
  }, [baseStripe]);

  function fillCell(context, color, i) {
    var randomColor = Math.floor(Math.random() * 16777215).toString(16);
    context.fillStyle = color; //"#" + randomColor;
    context.fillRect(i * cellPixelLength, 0, cellPixelLength, cellPixelLength);
  }

  return (
    <Group position="center">
      <div
        style={{
          display: "grid",
          pointerEvents: "none",
          position: "absolute",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          gridTemplateColumns: `repeat(${PIX_COUNT}, 1fr)`,
        }}
      >
        {[...Array(PIX_COUNT)].map((v, i) => (
          <div
            key={"led" + i}
            style={{ border: "1px solid rgba(0, 0, 0, 0.1)" }}
          ></div>
        ))}
      </div>
      <canvas
        onMouseMove={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          const canvasBoundingRect = canvas.getBoundingClientRect();
          if (e.ctrlKey) {
            const x = e.clientX - canvasBoundingRect.left;
            const cellX = Math.floor(x / cellPixelLength);
            if (baseStripe[cellX] === props.color) return;
            fillCell(ctx, props.color, cellX);

            setBaseStripe((prev) => {
              const newBaseStripe = [...prev];
              newBaseStripe[cellX] = props.color;
              return newBaseStripe;
            });
          }
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          const canvasBoundingRect = canvas.getBoundingClientRect();
          const x = e.clientX - canvasBoundingRect.left;
          const cellX = Math.floor(x / cellPixelLength);
          if (baseStripe[cellX] === props.color) return;
          fillCell(ctx, props.color, cellX);

          setBaseStripe((prev) => {
            const newBaseStripe = [...prev];
            newBaseStripe[cellX] = props.color;
            return newBaseStripe;
          });
        }}
        ref={canvasRef}
        {...props}
        width={canvasWidth}
        height={canvasHeight}
      />
    </Group>
  );
};

export default Canvas;
