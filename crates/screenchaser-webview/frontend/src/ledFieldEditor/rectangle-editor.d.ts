declare class RectangleEditor {
  canvas: HTMLCanvasElement;
  rectangles: any[];
  selectedRects: Set<any>;

  constructor(
    containerOrId: HTMLElement | string,
    options?: {
      width?: number;
      height?: number;
      snapEnabled?: boolean;
      autoFitEnabled?: boolean;
      showNumbers?: boolean;
      onStateChange?: (state: any) => void;
      onRectanglesChanged?: (data: {
        rectangles: Array<{
          number: number;
          x: number;
          y: number;
          width: number;
          height: number;
        }>;
        canvasWidth: number;
        canvasHeight: number;
      }) => void;
    },
  );

  generateRectangles(count: number): void;
  loadMedia(file: File): void;
  clearBackground(): void;
  clearAll(): void;
  deleteSelected(): void;
  selectAll(): void;
  exportData(): {
    rectangles: Array<{
      number: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
    canvasWidth: number;
    canvasHeight: number;
  };
  importData(data: {
    rectangles: Array<{
      number?: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
    canvasWidth?: number;
    canvasHeight?: number;
  }): void;
  setSnapEnabled(enabled: boolean): void;
  setAutoFitEnabled(enabled: boolean): void;
  setShowNumbers(enabled: boolean): void;
  destroy(): void;
}

export default RectangleEditor;
