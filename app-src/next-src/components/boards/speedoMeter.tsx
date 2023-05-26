import React from "react";
import { VictoryPie, VictoryLabel, VictoryChart, VictoryAxis } from "victory";

import { useMantineTheme } from "@mantine/core";

type Props = { percent: number; label: string };

export default function SpeedoMeter({ percent, label }: Props) {
  function getData(percent) {
    return [
      { x: 1, y: percent },
      { x: 2, y: 100 - percent },
    ];
  }
  const theme = useMantineTheme();
  return (
    <VictoryChart
      width={450}
      height={300}
      /*       animate={{ duration: 2000, easing: "bounce" }}
       */
    >
      <VictoryAxis
        style={{
          axis: { stroke: "transparent" },
          ticks: { stroke: "transparent" },
          tickLabels: { fill: "transparent" },
        }}
      />
      <VictoryPie
        standalone={false}
        data={getData(percent)}
        innerRadius={120}
        cornerRadius={25}
        labels={() => null}
/*         animate={{ duration: 200 }}
 */        style={{
          data: {
            fill: ({ datum }) => {
              const color = datum.y > 60 ? "#d35400" : "#27ae60";
              return datum.x === 1
                ? color
                : theme.colorScheme === "dark"
                ? theme.colors.dark[3]
                : theme.colors.dark[0];
            },
          },
        }}
      />

      <VictoryLabel
        x={225}
        y={150}
        textAnchor="middle"
        verticalAnchor="middle"
        text={label}
        style={{
          fontSize: 45,
          fill:
            theme.colorScheme === "dark"
              ? theme.colors.dark[0]
              : theme.colors.dark[9],
        }}
      />
    </VictoryChart>
  );
}
