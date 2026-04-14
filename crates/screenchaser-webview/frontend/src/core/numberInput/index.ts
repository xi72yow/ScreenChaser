import { setInputFilter } from "../inputFilter";
import "./index.css";

class NumberInput {
  private inputElement: HTMLInputElement;
  private container: HTMLElement | null;
  private float: boolean;
  private changeCallbacks: Array<(value: number) => void> = [];

  constructor({
    selector,
    maxValue,
    minValue,
    defaultValue,
    float = false,
    label,
    helperText,
    step = 1,
    container,
  }: {
    selector?: string;
    maxValue?: number;
    minValue?: number;
    defaultValue?: number;
    step?: number;
    float?: boolean;
    label?: string;
    helperText?: string;
    container?: HTMLElement;
  }) {
    this.container =
      (selector ? document.querySelector(selector) : null) || container || null;
    if (!this.container) {
      throw new Error(
        `Element with selector ${selector} not found or provided container is null`,
      );
    }

    const inputWrapper = document.createElement("div");

    const numberWrapper = document.createElement("div");
    numberWrapper.classList.add("number-wrapper");

    const numberInput = document.createElement("input");
    numberInput.classList.add("number-input");
    numberInput.id = "mantine-rv";
    numberInput.type = "text";
    numberInput.max = maxValue ? maxValue.toString() : "100";
    numberInput.min = minValue ? minValue.toString() : "0";
    numberInput.step = step.toString();
    numberInput.inputMode = "numeric";
    numberInput.setAttribute("aria-invalid", "false");
    numberInput.value = defaultValue ? defaultValue.toString() : "0";
    numberWrapper.appendChild(numberInput);
    numberInput.addEventListener("input", this.handleInput.bind(this));

    const buttonSectionWrapper = document.createElement("div");
    buttonSectionWrapper.classList.add("number-input-button-section-wrapper");

    const buttonSection = document.createElement("div");
    buttonSection.classList.add("number-input-button-section");

    const button1 = document.createElement("button");
    button1.type = "button";
    button1.tabIndex = -1;
    button1.classList.add("number-input-button");
    button1.setAttribute("aria-label", "Increase value");

    const svg1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg1.setAttribute("width", "14");
    svg1.setAttribute("height", "14");
    svg1.setAttribute("viewBox", "0 0 15 15");
    svg1.setAttribute("fill", "none");
    svg1.style.transform = "rotate(180deg)";

    const path1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path1.setAttribute(
      "d",
      "M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z",
    );
    path1.setAttribute("fill", "currentColor");
    path1.setAttribute("fill-rule", "evenodd");
    path1.setAttribute("clip-rule", "evenodd");

    svg1.appendChild(path1);
    button1.appendChild(svg1);
    buttonSection.appendChild(button1);

    const button2 = document.createElement("button");
    button2.type = "button";
    button2.tabIndex = -1;
    button2.classList.add("number-input-button");
    button2.setAttribute("aria-label", "Decrease value");

    const svg2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg2.setAttribute("width", "14");
    svg2.setAttribute("height", "14");
    svg2.setAttribute("viewBox", "0 0 15 15");
    svg2.setAttribute("fill", "none");

    const path2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path2.setAttribute(
      "d",
      "M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z",
    );
    path2.setAttribute("fill", "currentColor");
    path2.setAttribute("fill-rule", "evenodd");
    path2.setAttribute("clip-rule", "evenodd");

    svg2.appendChild(path2);
    button2.appendChild(svg2);
    buttonSection.appendChild(button2);

    button2.addEventListener("click", () => {
      if (parseFloat(numberInput.value) > parseFloat(numberInput.min)) {
        numberInput.value = (parseFloat(numberInput.value) - step).toString();
        this.handleInput();
      }
    });

    button1.addEventListener("click", () => {
      if (parseFloat(numberInput.value) < parseFloat(numberInput.max)) {
        numberInput.value = (parseFloat(numberInput.value) + step).toString();
        this.handleInput();
      }
    });

    this.float = float;

    // Add label
    if (label) {
      const labelElement = document.createElement("label");
      labelElement.classList.add("number-label");
      labelElement.textContent = label;
      inputWrapper.appendChild(labelElement);
    }

    buttonSectionWrapper.appendChild(buttonSection);
    numberWrapper.appendChild(buttonSectionWrapper);
    inputWrapper.appendChild(numberWrapper);

    const helperTextElement = document.createElement("div");
    helperTextElement.classList.add("number-helper-text");
    helperTextElement.textContent = helperText || "Set the value";
    inputWrapper.appendChild(helperTextElement);

    this.container.appendChild(inputWrapper);

    this.inputElement = numberInput;

    setInputFilter({
      textInput: numberInput,
      inputFilter: (value) => {
        if (!value) return true;
        if (this.float) {
          return /^\d*\.?\d*$/.test(value);
        } else {
          return /^\d*$/.test(value);
        }
      },
      validationCallback: (isValid) => {
        if (!isValid) {
          helperTextElement.classList.add("invalid");
          if (this.float) {
            helperTextElement.textContent = "Please enter a valid number";
          } else {
            helperTextElement.textContent = "Please enter a valid integer";
          }
        } else {
          helperTextElement.classList.remove("invalid");
          helperTextElement.textContent = helperText || "Set the value";
        }
      },
    });
  }

  private handleInput() {
    const val = parseFloat(this.inputElement.value);
    const max = parseFloat(this.inputElement.max);
    const min = parseFloat(this.inputElement.min);

    if (isNaN(val)) return;

    if (val > max) this.inputElement.value = max.toString();
    if (val < min) this.inputElement.value = min.toString();

    if (this.float) {
      this.inputElement.value = parseFloat(this.inputElement.value).toFixed(2);
    } else {
      this.inputElement.value = Math.round(parseFloat(this.inputElement.value)).toString();
    }

    this.changeCallbacks.forEach((cb) => cb(this.getValue()));
  }

  getValue(): number {
    return this.float
      ? parseFloat(this.inputElement.value)
      : parseInt(this.inputElement.value);
  }

  setValue(value: number, silent = false): void {
    this.inputElement.value = this.float ? value.toFixed(2) : value.toString();
    if (silent) {
      const max = parseFloat(this.inputElement.max);
      const min = parseFloat(this.inputElement.min);
      if (value > max) this.inputElement.value = this.float ? max.toFixed(2) : max.toString();
      if (value < min) this.inputElement.value = this.float ? min.toFixed(2) : min.toString();
    } else {
      this.handleInput();
    }
  }

  onChange(callback: (value: number) => void): void {
    this.changeCallbacks.push(callback);
  }
}

export default NumberInput;
