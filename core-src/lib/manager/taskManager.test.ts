import TaskManager from "./taskManager";

const taskManager = new TaskManager();

taskManager.setChaser({
  device: {
    ip: "192.168.2.131",
    new: "true",
    exclude: "false",
    name: "",
    neoPixelCount: 60,
    id: 1,
    taskId: 6,
    config: {
      cooling: 55,
      sparking: 120,
    },
    configId: 6,
  },
  config: {
    name: "Test",
    deviceId: 1,
    taskId: 9,
    taskCode: "fireFlame",
    config: {
      cooling: 55,
      sparking: 120,
    },
    id: 6,
  },
});

taskManager.setChaser({
  device: {
    ip: "192.168.2.113",
    new: "true",
    exclude: "false",
    name: "",
    neoPixelCount: 60,
    id: 2,
  },
  config: {
    taskCode: "nothing to do",
  },
});

setTimeout(() => {
  taskManager.setChaser({
    device: {
      ip: "192.168.2.113",
      new: "false",
      exclude: "false",
      name: "Desk",
      neoPixelCount: 114,
      id: 2,
      config: {
        lightColor: "#8bb128",
      },
      configId: 5,
    },
    config: {
      name: "pppp",
      deviceId: 1,
      taskId: 6,
      taskCode: "dyingLights",
      config: {
        lightColor: "#7559ea",
      },
      id: 5,
    },
  });
}, 5000);

setTimeout(() => {
  taskManager.setChaser({
    device: {
      ip: "192.168.2.113",
      new: "false",
      exclude: "false",
      name: "Desk",
      neoPixelCount: 114,
      id: 2,
      config: {
        lightColor: "#8bb128",
      },
      configId: 5,
    },
    config: {
      name: "pppp",
      deviceId: 1,
      taskId: 6,
      taskCode: "bubbles",
      config: {
        fadeValue: 10,
        maxParticles: 10,
        colors: ["#ff0000", "#00ff00", "#0000ff"],
      },
      id: 5,
    },
  });
}, 10000);
