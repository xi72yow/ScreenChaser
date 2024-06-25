import "./index.css";

type ToasterConfigurationObject = {
  text?: string;
  node?: HTMLElement;
  duration?: number;
  selector?: string | HTMLElement | ShadowRoot;
  close?: boolean;
  position?: string;
  avatar?: string;
  callback?: () => void;
  onClick?: () => void;
  ariaLive?: string;
};

const toaster = document.createElement("div");
toaster.className = "toaster";
document.body.appendChild(toaster);

class Toaster {
  defaults: ToasterConfigurationObject = {
    text: "Toaster is awesome!",
    node: undefined,
    duration: 3000,
    selector: undefined,
    callback: () => {},
    close: false,
    position: "",
    avatar: "",
    onClick: () => {},
    ariaLive: "polite",
  };

  options: ToasterConfigurationObject = {};
  toastElement: HTMLElement | null = null;
  private _rootElement: HTMLElement | ShadowRoot = document.body;

  constructor(options: ToasterConfigurationObject) {
    this._init(options);
  }

  showToast(): Toaster {
    this.toastElement = this._buildToast();

    this._rootElement = toaster;

    this._rootElement.insertBefore(
      this.toastElement,
      this._rootElement.firstChild
    );

    if (this.options.duration && this.options.duration > 0) {
      (this.toastElement as any).timeOutValue = window.setTimeout(() => {
        this._removeElement(this.toastElement!);
      }, this.options.duration);
    }

    return this;
  }

  hideToast() {
    if ((this.toastElement as any).timeOutValue) {
      clearTimeout((this.toastElement as any).timeOutValue);
    }
    this._removeElement(this.toastElement!);
  }

  private _init(options: ToasterConfigurationObject) {
    this.options = Object.assign(this.defaults, options);

    this.toastElement = null;
  }

  private _buildToast(): HTMLElement {
    if (!this.options) {
      throw new Error("Toaster is not initialized");
    }

    let divElement = document.createElement("div");
    divElement.classList.add("toast");

    if (this.options.ariaLive) {
      divElement.setAttribute("aria-live", this.options.ariaLive);
    }

    if (this.options.node && this.options.node.nodeType === Node.ELEMENT_NODE) {
      divElement.appendChild(this.options.node);
    } else {
      divElement.innerHTML = this.options.text!;

      if (this.options.avatar !== "") {
        let avatarElement = document.createElement("img");
        avatarElement.src = this.options.avatar!;

        avatarElement.className = "toaster-avatar";
      }
    }

    if (this.options.close === true) {
      let closeElement = document.createElement("button");
      closeElement.type = "button";
      closeElement.setAttribute("aria-label", "Close");
      closeElement.className = "toast-close";
      closeElement.innerHTML = "&#10006;";

      closeElement.addEventListener("click", (event) => {
        event.stopPropagation();
        this._removeElement(this.toastElement!);
        window.clearTimeout((this.toastElement as any).timeOutValue);
      });

      divElement.appendChild(closeElement);
    }

    if (this.options.duration! > 0) {
      divElement.addEventListener("mouseover", (event) => {
        window.clearTimeout((divElement as any).timeOutValue);
      });
      divElement.addEventListener("mouseleave", () => {
        (divElement as any).timeOutValue = window.setTimeout(() => {
          this._removeElement(divElement);
        }, this.options.duration);
      });
    }

    if (typeof this.options.onClick === "function") {
      divElement.addEventListener("click", (event) => {
        event.stopPropagation();
        this.options.onClick!();
      });
    }

    return divElement;
  }

  private _removeElement(toastElement: HTMLElement) {
    toastElement.classList.add("out");

    window.setTimeout(() => {
      if (this.options.node && this.options.node.parentNode) {
        this.options.node.parentNode.removeChild(this.options.node);
      }

      if (toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }

      this.options.callback!.call(toastElement);
    }, 400);
  }
}

function StartToasterInstance(options: ToasterConfigurationObject): Toaster {
  return new Toaster(options);
}

export default StartToasterInstance;
