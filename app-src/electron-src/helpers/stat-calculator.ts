import { ManagerInterface } from "screenchaser-core/dist/types";

class StatCalculator {
  Manager: ManagerInterface;
  statistics: Map<number, any>;
  constructor(parameters: { Manager: ManagerInterface }) {
    this.Manager = parameters.Manager;
    this.statistics = new Map();
  }

  calculateStats() {
    this.Manager.chasers.forEach(({ config, device, emitter }) => {
      const data = emitter.getHealth();

      const lastStatisic = this.statistics.get(device.id);

      const statisic = {
        title: device.name || device.ip,
        deviceId: device.id,
        task: config.taskCode,
        details: {
          power: {
            title: "Power:",
            value: data.power,
            maxPower: data.maxPower,
            icon: "bolt",
            diff: lastStatisic
              ? (data.power / lastStatisic.details.power?.value) * 100 - 100
              : 0,
          },
          packageLoss: {
            title: "Package Loss:",
            value: data.packageloss,
            icon: "package",
            diff: lastStatisic
              ? (data.packageloss / lastStatisic.details.packageloss?.value) *
                  100 -
                100
              : 0,
          },
        },
      };
      this.statistics.set(device.id, statisic);
    });

    const arr = Array.from(this.statistics, function (entry) {
      return { ...entry[1] };
    });

    return JSON.parse(JSON.stringify(arr));
  }
}

export default StatCalculator;
