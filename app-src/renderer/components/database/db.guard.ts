/*
 * Generated type guards for "db.ts".
 * WARNING: Do not manually change this file.
 */
import { StaticLightInterface, GlobalsInterface, ChaserInterface, DeviceInterface, TaskInterface, ConfigInterface } from "./db";

export function isStaticLightInterface(obj: unknown): obj is StaticLightInterface {
    const typedObj = obj as StaticLightInterface
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["baseStripe"]) &&
        typedObj["baseStripe"].every((e: any) =>
            typeof e === "string"
        )
    )
}

export function isGlobalsInterface(obj: unknown): obj is GlobalsInterface {
    const typedObj = obj as GlobalsInterface
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["swatches"]) &&
        typedObj["swatches"].every((e: any) =>
            typeof e === "string"
        )
    )
}

export function isChaserInterface(obj: unknown): obj is ChaserInterface {
    const typedObj = obj as ChaserInterface
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["sourceId"] === "string" &&
        typeof typedObj["name"] === "string"
    )
}

export function isDeviceInterface(obj: unknown): obj is DeviceInterface {
    const typedObj = obj as DeviceInterface
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["ip"] === "string" &&
        typeof typedObj["name"] === "string" &&
        typeof typedObj["neoPixelCount"] === "number" &&
        typeof typedObj["new"] === "boolean" &&
        typeof typedObj["exclude"] === "boolean"
    )
}

export function isTaskInterface(obj: unknown): obj is TaskInterface {
    const typedObj = obj as TaskInterface
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["taskCode"] === "string"
    )
}

export function isConfigInterface(obj: unknown): obj is ConfigInterface {
    const typedObj = obj as ConfigInterface
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["id"] === "number" &&
        isDeviceInterface(typedObj["device"]) as boolean &&
        isChaserInterface(typedObj["chaser"]) as boolean &&
        isGlobalsInterface(typedObj["globals"]) as boolean &&
        (typedObj["dyingLights"] !== null &&
            typeof typedObj["dyingLights"] === "object" ||
            typeof typedObj["dyingLights"] === "function") &&
        typeof typedObj["dyingLights"]["lightColor"] === "string" &&
        (typedObj["frostyPike"] !== null &&
            typeof typedObj["frostyPike"] === "object" ||
            typeof typedObj["frostyPike"] === "function") &&
        typeof typedObj["frostyPike"]["delay"] === "number" &&
        Array.isArray(typedObj["frostyPike"]["baseStripe"]) &&
        typedObj["frostyPike"]["baseStripe"].every((e: any) =>
            typeof e === "string"
        ) &&
        (typedObj["colorWheel"] !== null &&
            typeof typedObj["colorWheel"] === "object" ||
            typeof typedObj["colorWheel"] === "function") &&
        typeof typedObj["colorWheel"]["speed"] === "number" &&
        (typedObj["fireFlame"] !== null &&
            typeof typedObj["fireFlame"] === "object" ||
            typeof typedObj["fireFlame"] === "function") &&
        typeof typedObj["fireFlame"]["cooling"] === "number" &&
        typeof typedObj["fireFlame"]["sparking"] === "number" &&
        (typedObj["bouncingBalls"] !== null &&
            typeof typedObj["bouncingBalls"] === "object" ||
            typeof typedObj["bouncingBalls"] === "function") &&
        typeof typedObj["bouncingBalls"]["ballMode"] === "string" &&
        typeof typedObj["bouncingBalls"]["mirrored"] === "boolean" &&
        typeof typedObj["bouncingBalls"]["tail"] === "number" &&
        typeof typedObj["bouncingBalls"]["ballCount"] === "number" &&
        Array.isArray(typedObj["bouncingBalls"]["baseStripe"]) &&
        typedObj["bouncingBalls"]["baseStripe"].every((e: any) =>
            typeof e === "string"
        ) &&
        (typedObj["meteorRain"] !== null &&
            typeof typedObj["meteorRain"] === "object" ||
            typeof typedObj["meteorRain"] === "function") &&
        typeof typedObj["meteorRain"]["meteorSize"] === "number" &&
        typeof typedObj["meteorRain"]["meteorTrailDecay"] === "number" &&
        typeof typedObj["meteorRain"]["meteorRandomDecay"] === "number" &&
        typeof typedObj["meteorRain"]["rainbow"] === "boolean" &&
        typeof typedObj["meteorRain"]["meteorColor"] === "string" &&
        (typedObj["snake"] !== null &&
            typeof typedObj["snake"] === "object" ||
            typeof typedObj["snake"] === "function") &&
        typeof typedObj["snake"]["speed"] === "number" &&
        typeof typedObj["snake"]["maxSnakeSize"] === "number" &&
        typeof typedObj["snake"]["appleCount"] === "number" &&
        (typedObj["bubbles"] !== null &&
            typeof typedObj["bubbles"] === "object" ||
            typeof typedObj["bubbles"] === "function") &&
        typeof typedObj["bubbles"]["maxParticles"] === "number" &&
        typeof typedObj["bubbles"]["fadeValue"] === "number" &&
        Array.isArray(typedObj["bubbles"]["colors"]) &&
        typedObj["bubbles"]["colors"].every((e: any) =>
            typeof e === "string"
        ) &&
        isTaskInterface(typedObj["task"]) as boolean &&
        isStaticLightInterface(typedObj["staticLight"]) as boolean &&
        (typedObj["animation"] !== null &&
            typeof typedObj["animation"] === "object" ||
            typeof typedObj["animation"] === "function") &&
        Array.isArray(typedObj["animation"]["frames"]) &&
        typedObj["animation"]["frames"].every((e: any) =>
            Array.isArray(e) &&
            e.every((e: any) =>
                typeof e === "string"
            )
        ) &&
        typeof typedObj["animation"]["fps"] === "number"
    )
}
