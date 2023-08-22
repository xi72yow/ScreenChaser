export type LedField = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * @param {number} numRectangles
 * @param {number} containerWidth
 * @param {number} containerHeight
 * @param {number} rectangleWidth
 * @param {number} rectangleHeight
 * @param {string} position
 * @returns {Array} rectangles
 * @throws {Error} Invalid position
 * @example
 * placeRectanglesAlongEdge(16, 1280, 720, 50, 50, "top");
 * // returns
 * [
 *  { x: 0.9609375000000002, y: 0, width: 0.0390625, height: 0.06944444444444445 },
 *  { x: 0.8968750000000002, y: 0, width: 0.0390625, height: 0.06944444444444445 },
 *  ...
 * ]
 */
function placeRectanglesAlongEdge(
  numRectangles: number,
  rectangleWidth: number,
  rectangleHeight: number,
  position: "top" | "bottom" | "left" | "right"
) {
  if (numRectangles < 1) throw new Error("Invalid number of rectangles");
  if (rectangleWidth < 0 || rectangleWidth > 100)
    throw new Error("Invalid rectangle width");
  if (rectangleHeight < 0 || rectangleHeight > 100)
    throw new Error("Invalid rectangle height");

  const rectangles = [];
  let rectangleDistance;

  rectangleDistance = numRectangles * (rectangleWidth / 100);

  if (position === "left" || position === "right")
    rectangleDistance = numRectangles * (rectangleHeight / 100);

  const rectangleSpacing = (1 - rectangleDistance) / (numRectangles - 1);

  let current = 0;

  for (let i = 0; i < numRectangles; i++) {
    let rectangle = {};
    switch (position) {
      case "top":
        rectangle = {
          x: current,
          y: 0,
        };
        break;

      case "bottom":
        rectangle = {
          x: current,
          y: 1 - rectangleHeight / 100,
        };
        break;

      case "left":
        rectangle = {
          x: 0,
          y: current,
        };
        break;

      case "right":
        rectangle = {
          x: 1 - rectangleWidth / 100,
          y: current,
        };
        break;

      default:
        throw new Error("Invalid position");
    }

    rectangles.push({
      ...rectangle,
      width: rectangleWidth / 100,
      height: rectangleHeight / 100,
    });
    if (position === "left" || position === "right")
      current += rectangleHeight / 100 + rectangleSpacing;
    else current += rectangleWidth / 100 + rectangleSpacing;
  }

  return rectangles;
}

/**
 *
 * @param numLedsX number of leds in x direction
 * @param numLedsY number of leds in y direction
 * @param ledWidthPix width of the field the led represents in pixels
 * @param ledHeightPix height of the field the led represents in pixels
 * @param imageWidth width of the image in pixels
 * @param imageHeight width of the image in pixels
 * @returns LedField[]
 * @example
 * generateLedFields(63, 39, 200, 200, 1920, 1080);
 */
export function generateLedFields({
  ledsX,
  ledsY,
  startLed,
  fieldWidth,
  fieldHeight,
  top,
  bottom,
  left,
  right,
  clockwise,
}: {
  ledsX: number;
  ledsY: number;
  startLed: number;
  fieldWidth: number;
  fieldHeight: number;
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
  clockwise: boolean;
}) {
  const topFields = top
    ? placeRectanglesAlongEdge(ledsX, fieldWidth, fieldHeight, "top")
    : [];

  const bottomFields = bottom
    ? placeRectanglesAlongEdge(ledsX, fieldWidth, fieldHeight, "bottom")
    : [];

  const leftFields = left
    ? placeRectanglesAlongEdge(ledsY, fieldWidth, fieldHeight, "left")
    : [];

  const rightFields = right
    ? placeRectanglesAlongEdge(ledsY, fieldWidth, fieldHeight, "right")
    : [];

  const fields = [
    ...(clockwise ? bottomFields.reverse() : bottomFields),
    ...(clockwise ? rightFields : rightFields.reverse()),
    ...(!clockwise ? topFields.reverse() : topFields),
    ...(!clockwise ? leftFields : leftFields.reverse()),
  ];

  const fieldsAround = clockwise ? fields.reverse() : fields;

  return [
    ...fieldsAround.slice(startLed, fieldsAround.length),
    ...fieldsAround.slice(0, startLed),
  ];
}
