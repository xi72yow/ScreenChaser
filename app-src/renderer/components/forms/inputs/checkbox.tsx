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
    form.setFieldValue(path, defaultValue);
  }, []);

  return (
    <Checkbox
      sx={{ marginTop: 3, marginBottom: 3 }}
      label={label}
      onChange={(e) => {
        form.setFieldValue(path, e.currentTarget.checked);
      }}
    />
  );
}
