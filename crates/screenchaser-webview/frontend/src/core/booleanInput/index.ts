import "./index.css";

class BooleanInput {
  private container: HTMLElement | null;

  constructor({
    selector,
    defaultValue = false,
    label,
    helperText,
    container,
  }: {
    selector?: string;
    defaultValue?: boolean;
    label?: string;
    helperText?: string;
    container?: HTMLElement;
  }) {
    this.container =
      (selector ? document.querySelector(selector) : null) || container || null;
    if (!this.container) {
      throw new Error(
        `Element with selector ${selector} not found or provided container is null`
      );
    }

    const inputWrapper = document.createElement("div");

    const booleanWrapper = document.createElement("div");
    booleanWrapper.classList.add("boolean-wrapper");

    const booleanInput = document.createElement("input");
    booleanInput.classList.add("boolean-input");
    booleanInput.type = "checkbox";
    booleanInput.checked = defaultValue;
    booleanWrapper.appendChild(booleanInput);
    booleanInput.addEventListener("change", this.handleInput.bind(this));

    // Add label
    if (label) {
      const labelElement = document.createElement("label");
      labelElement.classList.add("boolean-label");
      labelElement.textContent = label;
      inputWrapper.appendChild(labelElement);
    }

    inputWrapper.appendChild(booleanWrapper);

    const helperTextElement = document.createElement("div");
    helperTextElement.classList.add("boolean-helper-text");
    helperTextElement.textContent = helperText || "Toggle the value";
    inputWrapper.appendChild(helperTextElement);

    this.container.appendChild(inputWrapper);

    void booleanInput;
  }

  private handleInput() {
    // Handle input change if needed
  }
}

export default BooleanInput;
