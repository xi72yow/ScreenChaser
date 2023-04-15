import { createContext, useState, useContext, useMemo } from "react";

export const FormContext = createContext(
  {} as {
    selectedDeviceIdContext: number;
    setSelectedDeviceIdContext: React.Dispatch<React.SetStateAction<number>>;
  }
);

export const FormProvider = ({ children }) => {
  const [selectedDeviceIdContext, setSelectedDeviceIdContext] = useState(1);

  const value = useMemo(
    () => ({ selectedDeviceIdContext, setSelectedDeviceIdContext }),
    [selectedDeviceIdContext, setSelectedDeviceIdContext]
  );

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};
