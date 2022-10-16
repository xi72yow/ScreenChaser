import { Group } from "@mantine/core";
import React, { useRef, useEffect } from "react";

const Canvas = (props) => {
  const canvasRef = useRef(null);
  const canvasWidth = window.innerWidth - window.innerWidth * 0.1;
  const PIX_COUNT = 115;
  const canvasHeight = canvasWidth / PIX_COUNT;

  const draw = (ctx) => {
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(50, 100, 20, 0, 2 * Math.PI);
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const cellPixelLength = canvas.width / PIX_COUNT;
    // Initialize the canvas background
    context.fillStyle = "#FFF";
    context.fillRect(0, 0, canvas.width, canvas.height);

    function fillCell(cellX, cellY) {
      const startX = cellX * cellPixelLength;
      const startY = cellY * cellPixelLength;

      var randomColor = Math.floor(Math.random() * 16777215).toString(16);

      context.fillStyle = "#" + randomColor;
      context.fillRect(startX, startY, cellPixelLength, cellPixelLength);
    }
    function handleFillCell(e) {
      if (e.button !== 0) {
        return;
      }
      const canvasBoundingRect = canvas.getBoundingClientRect();
      const x = e.clientX - canvasBoundingRect.left;
      const y = e.clientY - canvasBoundingRect.top;
      const cellX = Math.floor(x / cellPixelLength);
      const cellY = Math.floor(y / cellPixelLength);

      fillCell(cellX, cellY);
      e.stopPropagation();
      e.preventDefault();
    }

    canvas.addEventListener("mousedown", function (e) {
      handleFillCell(e);

      canvas.onmousemove = function (e) {
        handleFillCell(e);
      };
    });

    canvas.addEventListener("mouseup", function (e) {
      canvas.onmousemove = null;
    });

    canvas.addEventListener("mouseleave", function (e) {
      canvas.onmousemove = null;
    });

    //Our draw come here
    //draw(context);
  }, [draw]);

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
        {[...Array(PIX_COUNT)].map(() => (
          <div style={{ border: "1px solid rgba(0, 0, 0, 0.1)" }}></div>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        {...props}
        width={canvasWidth}
        height={canvasHeight}
      />
    </Group>
  );
};

export default Canvas;
