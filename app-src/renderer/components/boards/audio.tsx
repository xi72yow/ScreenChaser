import styled from "@emotion/styled";
import { Group } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import React from "react";

const SpeakerBox = styled.div<{ width: number }>`
  background: #222;
  border-radius: 0.5em;
  border: 1px solid #333;
  width: ${({ width }) => (width ? `${width * 0.25}px` : "100%")};
  height: 300px;
`;

const High = styled.div<{}>`
  background: #222;
  border-radius: 50%;
  border: 0.5em solid #aaa;
  height: 75px;
  width: 75px;
  margin: 0.5em;
`;

const Low = styled.div<{}>`
  background: #111;
  border-radius: 50%;
  border: 0.5em solid #aaa;
  height: 180px;
  width: 180px;
  margin: 0.5em;
`;

type Props = {};

export default function AudioChaser({}: Props) {
  const { ref: refSize, width, height } = useElementSize();

  return (
    <Group ref={refSize} position="center">
      {" "}
      <SpeakerBox width={800}>
        <Group ref={refSize} position="center">
          <High></High>
        </Group>
        <Group ref={refSize} position="center">
          <Low></Low>
        </Group>
      </SpeakerBox>
    </Group>
  );
}
