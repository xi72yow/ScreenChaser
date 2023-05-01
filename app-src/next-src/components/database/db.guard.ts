/*
 * Generated type guards for "db.ts".
 * WARNING: Do not manually change this file.
 */
import { StaticLightInterface, GlobalsInterface, ChaserInterface, DeviceInterface, TaskInterface, ConfigInterface, DeviceTableInterface, ConfigsTableInterface, TaskTypes, dbBool, TaskCodes, TaskTableInterface, UserTableInterface, TableNames } from "./db";

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
        typeof typedObj["name"] === "string" &&
        (typedObj["setUp"] !== null &&
            typeof typedObj["setUp"] === "object" ||
            typeof typedObj["setUp"] === "function") &&
        (typedObj["setUp"]["rowB"] === 0 ||
            typedObj["setUp"]["rowB"] === -1) &&
        (typedObj["setUp"]["colR"] === 0 ||
            typedObj["setUp"]["colR"] === -1) &&
        (typedObj["setUp"]["rowT"] === 0 ||
            typedObj["setUp"]["rowT"] === -1) &&
        (typedObj["setUp"]["colL"] === 0 ||
            typedObj["setUp"]["colL"] === -1) &&
        typeof typedObj["startLed"] === "number" &&
        typeof typedObj["clockWise"] === "boolean" &&
        typeof typedObj["width"] === "number" &&
        typeof typedObj["height"] === "number"
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

export function isDeviceTableInterface(obj: unknown): obj is DeviceTableInterface {
    const typedObj = obj as DeviceTableInterface
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["id"] === "number" &&
        typeof typedObj["ip"] === "string" &&
        typeof typedObj["name"] === "string" &&
        typeof typedObj["neoPixelCount"] === "number" &&
        typeof typedObj["new"] === "boolean" &&
        isdbBool(typedObj["exclude"]) as boolean &&
        typeof typedObj["configId"] === "number"
    )
}

export function isConfigsTableInterface(obj: unknown): obj is ConfigsTableInterface {
    const typedObj = obj as ConfigsTableInterface
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["id"] === "number" &&
        typeof typedObj["deviceId"] === "number" &&
        typeof typedObj["taskId"] === "number" &&
        isTaskCodes(typedObj["taskCode"]) as boolean &&
        typeof typedObj["name"] === "string" &&
        (isStaticLightInterface(typedObj["config"]) as boolean ||
            (typedObj["config"] !== null &&
                typeof typedObj["config"] === "object" ||
                typeof typedObj["config"] === "function") &&
            typeof typedObj["config"]["lightColor"] === "string" ||
            (typedObj["config"] !== null &&
                typeof typedObj["config"] === "object" ||
                typeof typedObj["config"] === "function") &&
            typeof typedObj["config"]["delay"] === "number" &&
            Array.isArray(typedObj["config"]["baseStripe"]) &&
            typedObj["config"]["baseStripe"].every((e: any) =>
                typeof e === "string"
            ) ||
            (typedObj["config"] !== null &&
                typeof typedObj["config"] === "object" ||
                typeof typedObj["config"] === "function") &&
            typeof typedObj["config"]["speed"] === "number" ||
            (typedObj["config"] !== null &&
                typeof typedObj["config"] === "object" ||
                typeof typedObj["config"] === "function") &&
            typeof typedObj["config"]["cooling"] === "number" &&
            typeof typedObj["config"]["sparking"] === "number" ||
            (typedObj["config"] !== null &&
                typeof typedObj["config"] === "object" ||
                typeof typedObj["config"] === "function") &&
            typeof typedObj["config"]["ballMode"] === "string" &&
            typeof typedObj["config"]["mirrored"] === "boolean" &&
            typeof typedObj["config"]["tail"] === "number" &&
            typeof typedObj["config"]["ballCount"] === "number" &&
            Array.isArray(typedObj["config"]["baseStripe"]) &&
            typedObj["config"]["baseStripe"].every((e: any) =>
                typeof e === "string"
            ) ||
            (typedObj["config"] !== null &&
                typeof typedObj["config"] === "object" ||
                typeof typedObj["config"] === "function") &&
            typeof typedObj["config"]["meteorSize"] === "number" &&
            typeof typedObj["config"]["meteorTrailDecay"] === "number" &&
            typeof typedObj["config"]["meteorRandomDecay"] === "number" &&
            typeof typedObj["config"]["rainbow"] === "boolean" &&
            typeof typedObj["config"]["meteorColor"] === "string" ||
            (typedObj["config"] !== null &&
                typeof typedObj["config"] === "object" ||
                typeof typedObj["config"] === "function") &&
            typeof typedObj["config"]["speed"] === "number" &&
            typeof typedObj["config"]["maxSnakeSize"] === "number" &&
            typeof typedObj["config"]["appleCount"] === "number" ||
            (typedObj["config"] !== null &&
                typeof typedObj["config"] === "object" ||
                typeof typedObj["config"] === "function") &&
            typeof typedObj["config"]["maxParticles"] === "number" &&
            typeof typedObj["config"]["fadeValue"] === "number" &&
            Array.isArray(typedObj["config"]["colors"]) &&
            typedObj["config"]["colors"].every((e: any) =>
                typeof e === "string"
            ) ||
            (typedObj["config"] !== null &&
                typeof typedObj["config"] === "object" ||
                typeof typedObj["config"] === "function") &&
            Array.isArray(typedObj["config"]["frames"]) &&
            typedObj["config"]["frames"].every((e: any) =>
                Array.isArray(e) &&
                e.every((e: any) =>
                    typeof e === "string"
                )
            ) &&
            typeof typedObj["config"]["fps"] === "number")
    )
}

export function isTaskTypes(obj: unknown): obj is TaskTypes {
    const typedObj = obj as TaskTypes
    return (
        (typedObj === TaskTypes.chaser ||
            typedObj === TaskTypes.effect ||
            typedObj === TaskTypes.render ||
            typedObj === TaskTypes.ui)
    )
}

export function isdbBool(obj: unknown): obj is dbBool {
    const typedObj = obj as dbBool
    return (
        (typedObj === dbBool.true ||
            typedObj === dbBool.false)
    )
}

export function isTaskCodes(obj: unknown): obj is TaskCodes {
    const typedObj = obj as TaskCodes
    return (
        (typedObj === TaskCodes.dashboard ||
            typedObj === TaskCodes.library ||
            typedObj === TaskCodes.videoChaser ||
            typedObj === TaskCodes.animation ||
            typedObj === TaskCodes.dyingLights ||
            typedObj === TaskCodes.frostyPike ||
            typedObj === TaskCodes.colorWheel ||
            typedObj === TaskCodes.fireFlame ||
            typedObj === TaskCodes.bouncingBalls ||
            typedObj === TaskCodes.meteorRain ||
            typedObj === TaskCodes.snake ||
            typedObj === TaskCodes.bubbles ||
            typedObj === TaskCodes.staticLight)
    )
}

export function isTaskTableInterface(obj: unknown): obj is TaskTableInterface {
    const typedObj = obj as TaskTableInterface
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["id"] === "number" &&
        isTaskCodes(typedObj["taskCode"]) as boolean &&
        typeof typedObj["label"] === "string" &&
        isTaskTypes(typedObj["type"]) as boolean &&
        isdbBool(typedObj["favorite"]) as boolean &&
        (typedObj["formScheme"] !== null &&
            typeof typedObj["formScheme"] === "object" ||
            typeof typedObj["formScheme"] === "function") &&
        typeof typedObj["formScheme"]["parse"] === "function" &&
        typeof typedObj["formScheme"]["stringify"] === "function" &&
        typeof typedObj["formScheme"]["stringify"] === "function"
    )
}

export function isUserTableInterface(obj: unknown): obj is UserTableInterface {
    const typedObj = obj as UserTableInterface
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["id"] === "number" &&
        Array.isArray(typedObj["swatches"]) &&
        typedObj["swatches"].every((e: any) =>
            typeof e === "string"
        )
    )
}

export function isTableNames(obj: unknown): obj is TableNames {
    const typedObj = obj as TableNames
    return (
        (typedObj === TableNames.devices ||
            typedObj === TableNames.configs ||
            typedObj === TableNames.tasks ||
            typedObj === TableNames.users)
    )
}
