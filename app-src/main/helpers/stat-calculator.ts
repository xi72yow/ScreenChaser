import { ManagerInterface } from "screenchaser-core";

class StatCalculator {
  Manager: ManagerInterface;
  statistics: Map<number, any>;
  constructor(parameters) {
    this.Manager = parameters.Manager;
    this.statistics = new Map();
  }

  calculateStats() {
    this.Manager.chasers.forEach(
      ({ config, device, emitter, runningEffect }) => {
        const effect = runningEffect;
        const data = emitter.getHealth();

        const lastStatisic = this.statistics.get(device.id);

        const statisic = {
          title: emitter.getIp(),
          task: effect
            ? effect.getIdentifier()
            : config.taskCode === "videoChaser"
            ? "chaser"
            : null,
          details: [
            {
              title: "Power:",
              value: data.power,
              maxPower: data.maxPower,
              icon: "bolt",
              diff: lastStatisic
                ? (data.power / lastStatisic.details[0]?.value) * 100 - 100
                : 0,
            },
            {
              title: "Package Loss:",
              value: data.packageloss,
              icon: "package",
              diff: lastStatisic
                ? (data.packageloss / lastStatisic.details[1]?.value) * 100 -
                  100
                : 0,
            },
          ],
        };
        this.statistics.set(device.id, statisic);
      }
    );

    const arr = Array.from(this.statistics, function (entry) {
      return { ...entry[1] };
    });

    return JSON.parse(JSON.stringify(arr));
  }
}

export default StatCalculator;
