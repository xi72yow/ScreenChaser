// @ts-nocheck
// tslint:disable
//this is experimental, it is not used in the app yet

export function renderConfig() {
  global.ipcRenderer
    .invoke("GET_SOURCES", {
      height: 768,
      width: 1366,
    })
    .then(async (sources) => {
      for (let s in sources) {
        if (sources[s].id === selected.id) {
          const horizontalPixels = form.values.chaser.width;
          const verticalPixels = form.values.chaser.height;
          const { rowB, colR, rowT, colL } = form.values.chaser.setUp;
          const canvasCTX = canvasRef.current.getContext("2d");
          const dataURL = sources[s].thumbnail.toDataURL();
          const img = new Image();
          img.src = dataURL;
          img.onload = function () {
            canvasCTX.drawImage(img, 0, 0, 1366, 768);
            canvasCTX.fillStyle = "rgba(0, 0, 0, 0.5)";
            canvasCTX.fillRect(0, 0, 1366, 768);
            canvasCTX.font = "13px Arial";
            const space = 0.1;
            const canvasWidth = 1366;
            const canvasHeight = 768;
            const clockWise = form.values.chaser.clockWise;
            const neoPixelCount = form.values.device.neoPixelCount;
            const startLed = form.values.chaser.startLed;

            const pixH = canvasWidth / (horizontalPixels * (space + 1));
            const pixV =
              (canvasHeight - 2 * pixH) / (verticalPixels * (space + 1));

            const pix = Math.min(pixH, pixV);

            const extraSpaceH =
              (canvasWidth - horizontalPixels * pix * (1 + space)) /
              horizontalPixels /
              pix;

            const extraSpaceV =
              (canvasHeight -
                2 * pix * (1 + space + extraSpaceH) -
                verticalPixels * pix * (1 + space)) /
              verticalPixels /
              pix;

            function renderVerticalPixel(
              ctx,
              scope,
              pix,
              index,
              space,
              extraSpace
            ) {
              if (scope === "right")
                ctx.fillRect(
                  canvasWidth - pix * (1 + space),
                  canvasHeight -
                    pix -
                    (index + 1) * pix * (1 + space + extraSpace),
                  pix,
                  pix
                );
              else
                canvasCTX.fillRect(
                  0,
                  (index + 1) * pix * (1 + space + extraSpace),
                  pix,
                  pix
                );
            }

            function renderHorizontalPixel(
              ctx,
              scope,
              pix,
              index,
              space,
              extraSpace
            ) {
              if (scope === "top")
                ctx.fillRect(
                  canvasWidth - (index + 1) * pix * (1 + space + extraSpace),
                  0,
                  pix,
                  pix
                );
              else
                ctx.fillRect(
                  index * pix * (1 + space + extraSpace),
                  canvasHeight - pix * (1 + space),
                  pix,
                  pix
                );
            }

            for (let i = 0; i < horizontalPixels; i++) {
              if (i === startLed) {
                canvasCTX.fillStyle = "rgba(255, 0, 0, 0.5)";
              } else {
                canvasCTX.fillStyle = "rgba(255, 255, 255, 0.5)";
              }
              if (rowT > -1) {
                renderHorizontalPixel(
                  canvasCTX,
                  "top",
                  pix,
                  i,
                  space,
                  extraSpaceH
                );
              }
              if (rowB > -1) {
                renderHorizontalPixel(
                  canvasCTX,
                  "bottom",
                  pix,
                  i,
                  space,
                  extraSpaceH
                );
              }
            }

            for (let i = 0; i < verticalPixels; i++) {
              if (colR > -1) {
                renderVerticalPixel(
                  canvasCTX,
                  "right",
                  pix,
                  i,
                  space,
                  extraSpaceV
                );
              }
              if (colL > -1) {
                renderVerticalPixel(
                  canvasCTX,
                  "left",
                  pix,
                  i,
                  space,
                  extraSpaceV
                );
              }
            }
          };
        }
      }
    });
}
