export const dyingLightsSchema = {
  type: "object",
  properties: {
    lightColor: {
      type: "string",
    },
  },
};

export const dyingLightsUiSchema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      label: "Light Color",
      scope: "#/properties/lightColor",
      options: { color: true },
    },
  ],
};

export const dyingLightsDefaultData = {
  lightColor: "#9B03FF",
};

export const frostyPikeSchema = {
  type: "object",
  properties: {
    delay: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
    baseStripe: {
      type: "array",
      singleFrame: true,
    },
  },
};

export const frostyPikeUiSchema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      label: "Delay",
      scope: "#/properties/delay",
    },
    {
      type: "Control",
      label: "Base Stripe",
      scope: "#/properties/baseStripe",
      options: { stripe: true },
    },
  ],
};

export const frostyPikeDefaultData = {
  delay: 10,
  baseStripe: [["#000000"]],
};

export const colorWheelSchema = {
  type: "object",
  properties: {
    speed: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
  },
};

export const colorWheelUiSchema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      label: "Speed",
      scope: "#/properties/speed",
    },
  ],
};

export const colorWheelDefaultData = {
  speed: 10,
};

export const meteorRainSchema = {
  type: "object",
  properties: {
    meteorTrailDecay: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
    meteorRandomDecay: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
    rainbow: {
      type: "boolean",
    },
    meteorColor: {
      type: "string",
    },
    meteorSize: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
  },
};

export const meteorRainUiSchema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      label: "Meteor Trail Decay",
      scope: "#/properties/meteorTrailDecay",
    },
    {
      type: "Control",
      label: "Meteor Random Decay",
      scope: "#/properties/meteorRandomDecay",
    },
    {
      type: "Control",
      label: "Rainbow",
      scope: "#/properties/rainbow",
    },
    {
      type: "Control",
      label: "Meteor Color",
      scope: "#/properties/meteorColor",
      options: { color: true },
    },
    {
      type: "Control",
      label: "Meteor Size",
      scope: "#/properties/meteorSize",
    },
  ],
};

export const meteorRainDefaultData = {
  meteorRandomDecay: 7,
  meteorTrailDecay: 64,
  meteorSize: 10,
  rainbow: false,
  meteorColor: "#9B03FF",
};

export const bouncingBallsSchema = {
  type: "object",
  properties: {
    ballMode: {
      type: "string",
      enum: ["random" /* , "stripe" */],
    },
    mirrored: {
      type: "boolean",
    },
    tail: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
    ballCount: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
    /*  baseStripe: {
      type: "array",
      singleFrame: true,
    }, */
  },
};

export const bouncingBallsUiSchema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      label: "Ball Mode",
      scope: "#/properties/ballMode",
      options: { select: true },
    },
    {
      type: "Control",
      label: "Mirrored",
      scope: "#/properties/mirrored",
    },
    {
      type: "Control",
      label: "Tail",
      scope: "#/properties/tail",
    },
    {
      type: "Control",
      label: "Ball Count",
      scope: "#/properties/ballCount",
    },
    /* {
      type: "Control",
      label: "Base Stripe",
      scope: "#/properties/baseStripe",
      options: { stripe: true },
      rule: {
        effect: "HIDE",
        condition: {
          scope: "#/properties/tail",
          schema: {
            properties: {
              schema: { not: { const: 0 } },
            },
          },
        },
      },
    }, */
  ],
};

export const bouncingBallsDefaultData = {
  ballMode: "random",
  mirrored: false,
  tail: 0,
  ballCount: 10,
  /*baseStripe: [["#000000"]],*/
};

export const snakeSchema = {
  type: "object",
  properties: {
    speed: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
    maxSnakeSize: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
    appleCount: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
  },
};

export const snakeUiSchema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      label: "Speed",
      scope: "#/properties/speed",
    },
    {
      type: "Control",
      label: "Max Snake Size",
      scope: "#/properties/maxSnakeSize",
    },
    {
      type: "Control",
      label: "Apple Count",
      scope: "#/properties/appleCount",
    },
  ],
};

export const snakeDefaultData = {
  speed: 1,
  maxSnakeSize: 10,
  appleCount: 3,
};

export const videoChaserSchema = {
  type: "object",
  properties: {
    sourceId: {
      type: "string",
    },
    width: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
    height: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },

    startLed: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
    rowT: {
      type: "boolean",
    },
    rowB: {
      type: "boolean",
    },
    colL: {
      type: "boolean",
    },
    colR: {
      type: "boolean",
    },
    clockWise: {
      type: "boolean",
    },
  },
};

export const videoChaserUiSchema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      label: "Source",
      scope: "#/properties/sourceId",
      options: { device: true },
    },
    {
      type: "Control",
      label: "Width",
      scope: "#/properties/width",
    },
    {
      type: "Control",
      label: "Height",
      scope: "#/properties/height",
    },
    {
      type: "Control",
      label: "Start Led",
      scope: "#/properties/startLed",
    },
    {
      type: "Control",
      label: "Row T",
      scope: "#/properties/rowT",
    },
    {
      type: "Control",
      label: "Row B",
      scope: "#/properties/rowB",
    },
    {
      type: "Control",
      label: "Col L",
      scope: "#/properties/colL",
    },
    {
      type: "Control",
      label: "Col R",
      scope: "#/properties/colR",
    },
    {
      type: "Control",
      label: "Clock Wise",
      scope: "#/properties/clockWise",
    },
  ],
};

export const videoChaserDefaultData = {
  sourceId: "",
  width: 114,
  height: 0,
  startLed: 0,
  rowT: false,
  rowB: true,
  rowL: false,
  rowR: false,
  clockWise: false,
};

export const staticLightSchema = {
  type: "object",
  properties: {
    baseStripe: {
      type: "array",
      singleFrame: true,
    },
  },
};

export const staticLightUiSchema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      label: "Base Stripe",
      scope: "#/properties/baseStripe",
      options: { stripe: true },
    },
  ],
};

export const staticLightDefaultData = {
  baseStripe: [["#000000"]],
};

export const animationSchema = {
  type: "object",
  properties: {
    frames: {
      type: "array",
      singleFrame: false,
    },
    fps: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
  },
};

export const animationUiSchema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      label: "Frames",
      scope: "#/properties/frames",
      options: { stripe: true },
    },
    {
      type: "Control",
      label: "FPS",
      scope: "#/properties/fps",
    },
  ],
};

export const animationDefaultData = {
  frames: [[["#000000"], ["#000000"]]],
  fps: 10,
};

export const fireFlameSchema = {
  type: "object",
  properties: {
    cooling: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
    sparking: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
  },
};

export const fireFlameUiSchema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      label: "Cooling",
      scope: "#/properties/cooling",
    },
    {
      type: "Control",
      label: "Sparking",
      scope: "#/properties/sparking",
    },
  ],
};

export const fireFlameDefaultData = {
  cooling: 55,
  sparking: 120,
};

export const bubblesSchema = {
  type: "object",
  properties: {
    fadeValue: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
    maxParticles: {
      type: "integer",
      minimum: 0,
      maximum: 255,
    },
    colors: {
      type: "array",
    },
  },
};

export const bubblesUiSchema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      label: "Fade Value",
      scope: "#/properties/fadeValue",
    },
    {
      type: "Control",
      label: "Max Particles",
      scope: "#/properties/maxParticles",
    },
    {
      type: "Control",
      label: "Colors",
      scope: "#/properties/colors",
      options: { colors: true },
    },
  ],
};

export const bubblesDefaultData = {
  fadeValue: 10,
  maxParticles: 10,
  colors: ["#ff0000", "#00ff00", "#0000ff"],
};
