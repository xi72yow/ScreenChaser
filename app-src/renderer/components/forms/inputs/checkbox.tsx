import { Checkbox } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import React from "react";
import { ConfigInterface } from "../../database/db";

/**
 * @param {string} label - The label of the checkbox
 * @param {UseFormReturnType<ConfigInterface>} form - The form object
 * @param {string} path - The path to the value in the form object
 * @param {"bool" | "number"} mode - The mode of the checkbox
 */
interface CheckboxProps {
  label: string;
  form?: UseFormReturnType<ConfigInterface>;
  path: string;
  mode?: "bool" | "number";
}

var getObjectDataFromPath = function (obj, path) {
  for (var i = 0, path = path.split("."), len = path.length; i < len; i++) {
    obj = obj[path[i]];
  }
  return obj;
};

export default function CheckboxInput({
  label,
  form,
  path,
  mode = "bool",
}: CheckboxProps) {
  return (
    <Checkbox
      checked={
        mode === "number"
          ? !getObjectDataFromPath(form.values, path)
          : getObjectDataFromPath(form.values, path)
      }
      label={label}
      onChange={(event) => {
        if (mode === "number")
          form.setFieldValue(path, event.currentTarget.checked ? 0 : -1);
        else form.setFieldValue(path, event.currentTarget.checked);
      }}
    />
  );
}
