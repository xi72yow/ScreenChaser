import { useMantineTheme } from "@mantine/core";
import React, { useEffect, useRef } from "react";

class Stamper {
  width: any;
  height: any;
  shownPoints: any;
  lineWidth: any;
  graphColor: any;
  canvasRef: any;
  canvas: any;
  ctx: any;
  datagetter: any;
  getterCallTime: any;
  fps: number;
  data: any[];
  intervall: NodeJS.Timer;
  slide: number;
  scale: number;
  dataObject: any;
  animationRequest: number;
  evenLevelColor: any;
  oddLevelColor: any;

  constructor(
    dataGetter,
    getterCallTime,
    canvasRef,
    options = {} as {
      width: number;
      height: number;
      shownPoints: number;
      lineWidth: number;
    }
  ) {
    const {
      width = 300,
      height = 110,
      shownPoints = 5,
      lineWidth = 3,
    } = options;

    this.width = width;
    this.height = height;
    this.shownPoints = shownPoints;
    this.lineWidth = lineWidth;
    this.graphColor = "#000000";
    this.oddLevelColor = "#ffffff99";
    this.evenLevelColor = "#bbbbbb99";

    this.dataObject = null;

    this.canvasRef = canvasRef;
    this.canvas = canvasRef.current;
    this.ctx = this.canvas.getContext("2d");
    this.datagetter = dataGetter;
    this.getterCallTime = getterCallTime;
    this.fps = 60;
    this.data = new Array(this.shownPoints * 2).fill(0);

    this.animationRequest = null;

    this.intervall = this.intervall = setInterval(() => {
      const newData = this.datagetter(this.dataObject);
      this.data.shift();
      this.data.push(newData);
      this.slide = 0;
    }, this.getterCallTime);

    this.slide = 0;
    this.scale = window.devicePixelRatio;

    this.canvas.style.width = this.width + "px";
    this.canvas.style.height = this.height + "px";
    this.canvas.width = Math.floor(this.width * this.scale);
    this.canvas.height = Math.floor(this.height * this.scale);
    this.ctx.scale(this.scale, this.scale);
  }

  setDataObject(dataObject) {
    this.dataObject = dataObject;
  }

  drawCoordinateSystem() {
    for (let i = 0; i <= 3; i++) {
      this.ctx.beginPath();
      this.ctx.lineWidth = 0.5;
      if (i % 2 === 0) this.ctx.strokeStyle = this.evenLevelColor;
      else this.ctx.strokeStyle = this.oddLevelColor;
      const lineHeight =
        this.height - this.ctx.lineWidth - this.height * i * 0.25;
      this.ctx.moveTo(0, lineHeight);
      this.ctx.lineTo(this.canvas.width, lineHeight);
      this.ctx.stroke();
    }
  }

  drawData() {
    this.ctx.beginPath();
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = this.graphColor;
    this.data.forEach((value, index) => {
      const x =
        (index * this.width) / this.shownPoints -
        (this.slide * (this.width / this.shownPoints)) /
          ((this.getterCallTime / 1000) * this.fps);
      const y = this.height - value * this.height;
      this.ctx.lineTo(x, y);
    });
    this.slide++;
    this.ctx.stroke();
  }

  draw(that) {
    that.ctx.clearRect(0, 0, that.width, that.height);
    that.drawCoordinateSystem();
    that.drawData();
    that.animationRequest = requestAnimationFrame(that.draw.bind(null, that));
  }

  getDeviceFPS(): Promise<number> {
    return new Promise((resolve) =>
      requestAnimationFrame((t1) =>
        requestAnimationFrame((t2) => resolve(1000 / (t2 - t1)))
      )
    );
  }

  async startDrawing() {
    this.fps = await this.getDeviceFPS();
    this.animationRequest = requestAnimationFrame(this.draw.bind(null, this));
  }

  setColors(colors) {
    this.evenLevelColor = colors.evenLevelColor;
    this.oddLevelColor = colors.oddLevelColor;
    this.graphColor = colors.graphColor;
  }
}

interface GraphCanvasProps {
  stat: any;
}

export const GraphCanvas = React.memo((props: GraphCanvasProps) => {
  const canvasRef = useRef();
  const stampRef = useRef<Stamper>();

  const { stat } = props;

  const theme = useMantineTheme();

  useEffect(() => {
    stampRef.current = new Stamper(
      (stat) => {
        if (!stat) return 0;
        return stat.icon === "bolt"
          ? stat.value / stat.maxPower
          : stat.value * -0.01;
      },
      3000,
      canvasRef,
      {
        shownPoints: 5,
        lineWidth: 2,
        width: 100,
        height: 50,
      }
    );
    stampRef.current.startDrawing();
    return () => {
      clearInterval(stampRef.current.intervall);
      cancelAnimationFrame(stampRef.current.animationRequest);
    };
  }, []);

  useEffect(() => {
    stampRef.current.setDataObject(stat);
  }, [stat]);

  useEffect(() => {
    stampRef.current.setColors({
      evenLevelColor: theme.colorScheme === "dark" ? "#ffffff99" : "#33333399",
      oddLevelColor: theme.colorScheme === "dark" ? "#bbbbbb99" : "#aaaaaa99",
      graphColor: theme.colorScheme === "dark" ? "#ffffffaa" : "#000000aa",
    });
  }, [theme]);

  return (
    <>
      <canvas ref={canvasRef} />
    </>
  );
});
