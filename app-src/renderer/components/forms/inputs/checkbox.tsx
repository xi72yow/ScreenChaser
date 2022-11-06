import { Checkbox } from "@mantine/core";
import React from "react";

interface CheckboxProps {
  label: string;
  defaultValue?: boolean;
  form?: any;
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
