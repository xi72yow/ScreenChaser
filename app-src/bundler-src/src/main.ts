import "./variables.css";
import "./style.css";
import "./appShell.css";
import "./devices.css";

import "@/themeToggle";
import "@/addDeviceBtn";
import "@/logo";
import NumberInput from "@core/numberInput";
import Toaster from "@core/toasts";

const numberInput1 = new NumberInput({
  selector: ".app-footer",
  minValue: 0,
  maxValue: 100,
  defaultValue: 50,
  helperText: "Set the temperature",
  label: "Temperature",
});

setInterval(() => {
  Toaster({
    text: "This is a toast" + Math.random(),
    duration: 1000,
    selector: ".app-footer",
  }).showToast();
}, 800);
