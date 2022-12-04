import { Checkbox } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import React from "react";
import { ConfigInterface } from "../../database/db";

interface CheckboxProps {
  label: string;
  defaultValue?: boolean;
  form?: UseFormReturnType<ConfigInterface>;
  path: string;
}

export default function CheckboxInput({
  label,
  defaultValue = false,
  form,
  path,
}: CheckboxProps) {
  React.useEffect(() => {
    if (form) form.setFieldValue(path, defaultValue);
  }, []);

  return (
    <Checkbox
      sx={{ marginTop: ".8rem", marginBottom: 3 }}
      label={label}
      onChange={(event) => {
        if (form) form.setFieldValue(path, event.currentTarget.checked);
      }}
      {...form?.getInputProps(path, { type: "checkbox" })}
    />
  );
}
