import { NativeSelect } from "@mantine/core";
import React from "react";

interface CheckboxProps {
  label: string;
  defaultValue?: string;
  form: any;
  data: string[];
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
      defaultValue={defaultValue}
    />
  );
}
