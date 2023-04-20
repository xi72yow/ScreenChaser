import { createContext, useState, useContext, useMemo } from "react";

export const FormContext = createContext(
  {} as {
    selectedDeviceId: number;
    selectedConfigId: number;
  }
);

export const FormProvider = ({
  children,
  selectedDeviceId,
  selectedConfigId,
}) => {
  const value = useMemo(
    () => ({ selectedDeviceId, selectedConfigId }),
    [selectedDeviceId, selectedConfigId]
  );

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};
