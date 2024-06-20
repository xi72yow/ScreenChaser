import "./variables.css";
import "./style.css";
import "./appShell.css";
import "./devices.css";

import "@/themeToggle";
import "@/addDeviceBtn";
import "@/logo";
import NumberInput from "@core/numberInput";

const numberInput1 = new NumberInput({
  selector: ".app-footer",
  minValue: 0,
  maxValue: 100,
  defaultValue: 50,
  helperText: "Set the temperature",
  label: "Temperature",
});
