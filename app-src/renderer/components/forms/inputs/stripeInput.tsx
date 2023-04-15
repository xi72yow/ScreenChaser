import { withJsonFormsControlProps } from "@jsonforms/react";
import { Group, Text, useMantineTheme } from "@mantine/core";
import React, { useContext, useEffect } from "react";
import { useHorizontalScroll } from "../helpers/horizontalScroll";
import StripeCreator, { prepareStripe } from "./baseStripe/stripeCreator";
import StripeCreatorPreview from "./baseStripe/stripeCreatorPreview";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../database/db";
import { FormContext } from "../formContext";

type Props = {
  path: string;
  data: Array<Array<string>>;
  schema: any;
  label: string;
  handleChange: (path, data: Array<Array<string>>) => void;
};

export function StripeInput({
  data,
  path,
  handleChange,
  label,
  schema,
}: Props) {
  const { singleFrame } = schema;
  const theme = useMantineTheme();
  const scrollRef = useHorizontalScroll();

  const { selectedDeviceIdContext } = useContext(FormContext);

  const currentNeoPixelCount = useLiveQuery(
    async () => {
      const device = await db.devices.get(selectedDeviceIdContext);
      return device?.neoPixelCount;
    },
    [selectedDeviceIdContext],
    null
  );
  console.log("🚀 ~ file: stripeInput.tsx:40 ~ currentNeoPixelCount:", currentNeoPixelCount)

  useEffect(() => {
    if (currentNeoPixelCount) {
      handleChange(
        path,
        data.map((frame, index) => {
          if (currentNeoPixelCount === null) return frame;
          else return prepareStripe(frame, currentNeoPixelCount);
        })
      );
    }
  }, [currentNeoPixelCount]);

  return (
    <React.Fragment>
      <Text
        sx={{
          fontSize: theme.fontSizes.sm,
          fontWeight: 500,
          marginTop: "0.1rem",
        }}
      >
        {label}
      </Text>
      <Group
        sx={{
          paddingRight: `${theme.spacing.sm}px !important`,
          paddingLeft: `${theme.spacing.sm}px !important`,
          border: `1px solid ${
            theme.colorScheme === "dark" ? "transparent" : theme.colors.gray[3]
          }`,
          backgroundColor:
            theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.white,
          height: 42,
          borderRadius: theme.radius.sm,
          justifyContent: "space-between",
        }}
      >
        <Group ref={scrollRef} sx={{ overflowX: "auto", maxWidth: "90%" }}>
          <StripeCreatorPreview data={data}></StripeCreatorPreview>
        </Group>
        <StripeCreator
          handleChange={handleChange}
          data={data}
          path={path}
          singleFrame={singleFrame}
          currentNeoPixelCount={currentNeoPixelCount}
        ></StripeCreator>
      </Group>
    </React.Fragment>
  );
}

export default withJsonFormsControlProps(StripeInput);
