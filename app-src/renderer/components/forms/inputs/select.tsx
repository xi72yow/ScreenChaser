import { NativeSelect } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import React from "react";
import { ConfigInterface } from "../../database/db";

interface CheckboxProps {
  label: string;
  defaultValue?: string;
  form: UseFormReturnType<ConfigInterface>;
  data: Array<"color" | "random" | "rainbow">;
  path: string;
}

export default function CheckboxInput({
  label,
  defaultValue,
  form,
  path,
  data,
}: CheckboxProps) {
  React.useEffect(() => {
    if (form) form.setFieldValue(path, defaultValue);
  }, []);

  return (
    <NativeSelect
      data={data}
      label={label}
      onChange={(event) => {
        if (form) form.setFieldValue(path, event.currentTarget.value);
      }}
      {...form.getInputProps(path)}
    />
  );
}
