import "./index.css";

class NumberInput {
  private inputElement: HTMLInputElement;
  private container: Element | null;
  private float: boolean;

  constructor({
    selector,
    maxValue,
    minValue,
    defaultValue,
    float = false,
  }: {
    selector: string;
    maxValue?: number;
    minValue?: number;
    defaultValue?: number;
    float?: boolean;
  }) {
    this.container = document.querySelector(selector);
    if (!this.container) {
      throw new Error(`Element with selector ${selector} not found`);
    }
    this.float = float;
    this.inputElement = document.createElement("input");
    this.inputElement.type = "number";
    this.inputElement.min = minValue ? minValue.toString() : "0";
    this.inputElement.max = maxValue ? maxValue.toString() : "100";
    this.inputElement.value = defaultValue ? defaultValue.toString() : "0";
    this.inputElement.classList.add("number-input");
    this.inputElement.addEventListener("input", this.handleInput.bind(this));
    this.container.appendChild(this.inputElement);
  }

  private handleInput() {
    if (parseInt(this.inputElement.value) > parseInt(this.inputElement.max)) {
      this.inputElement.value = this.inputElement.max;
    }
    if (parseInt(this.inputElement.value) < parseInt(this.inputElement.min)) {
      this.inputElement.value = this.inputElement.min;
    }

    if (this.float) {
      if (isNaN(parseFloat(this.inputElement.value))) return;
      this.inputElement.value = parseFloat(this.inputElement.value).toFixed(2);
    } else {
      if (isNaN(parseInt(this.inputElement.value))) return;
      this.inputElement.value = parseInt(this.inputElement.value).toString();
    }

    console.log(
      "🚀 ~ NumberInput ~ handleInput ~ value:",
      this.inputElement.value,
      parseInt(this.inputElement.value)
    );
  }
}

export default NumberInput;
