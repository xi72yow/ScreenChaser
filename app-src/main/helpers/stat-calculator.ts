class StatCalculator {
  Manager: any;
  lastStats: any[];
  constructor(parameters) {
    this.Manager = parameters.Manager;
    this.lastStats = [];
  }

  calculateStats() {
    const that = this;
    let stats = [];
    for (let i = 0; i < this.Manager.emitters.length; i++) {
      const config = this.Manager.configs[i];
      const emitter = this.Manager.emitters[i];
      const effect = this.Manager.runningEffects[i];
      const data = emitter.getHealth();

      stats.push({
        title: emitter.getIp(),
        task: effect
          ? effect.getIdentifier()
          : config.task.taskCode === "chaser"
          ? "chaser"
          : null,
        details: [
          {
            title: "Power:",
            value: data.power,
            icon: "bolt",
            diff:
              this.lastStats.length !== 0
                ? that.lastStats[i] &&
                  (data.power / that.lastStats[i].details[0]?.value) * 100 - 100
                : 0,
          },
          {
            title: "Package Loss:",
            value: data.packageloss,
            icon: "package",
            diff:
              this.lastStats.length !== 0
                ? (data.packageloss / that.lastStats[i].details[1]?.value) *
                    100 -
                  100
                : 0,
          },
        ],
      });
    }

    this.lastStats = stats;

    return stats;
  }
}

export default StatCalculator;
