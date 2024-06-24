import "./index.css";

type ToasterConfigurationObject = {
  text?: string;
  node?: HTMLElement;
  duration?: number;
  selector?: string | HTMLElement | ShadowRoot;
  destination?: string;
  newWindow?: boolean;
  close?: boolean;
  gravity?: string;
  position?: string;
  backgroundColor?: string;
  avatar?: string;
  className?: string;
  stopOnFocus?: boolean;
  callback?: () => void;
  onClick?: () => void;
  offset?: { x: number | string; y: number | string };
  escapeMarkup?: boolean;
  ariaLive?: string;
  style?: { [key: string]: string };
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
    destination: undefined,
    newWindow: false,
    close: false,
    gravity: "toaster-top",
    position: "",
    backgroundColor: "",
    avatar: "",
    className: "",
    stopOnFocus: true,
    onClick: () => {},
    offset: { x: 0, y: 0 },
    escapeMarkup: true,
    ariaLive: "polite",
    style: { background: "" },
  };

  version: string = "1.12.0";
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

    this._reposition();

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

    if (this.options.backgroundColor) {
      console.warn(
        'DEPRECATION NOTICE: "backgroundColor" is being deprecated. Please use the "style.background" property.'
      );
    }

    this.toastElement = null;

    this.options.gravity =
      options.gravity === "bottom" ? "toaster-bottom" : "toaster-top";
    this.options.stopOnFocus =
      options.stopOnFocus === undefined ? true : options.stopOnFocus;
    if (options.backgroundColor) {
      this.options.style!.background = options.backgroundColor;
    }
  }

  private _buildToast(): HTMLElement {
    if (!this.options) {
      throw new Error("Toaster is not initialized");
    }

    let divElement = document.createElement("div");
    divElement.className = `toast on ${this.options.className}`;

    divElement.className += ` ${this.options.gravity}`;

    for (const property in this.options.style) {
      divElement.style[property as any] = this.options.style[property];
    }

    if (this.options.ariaLive) {
      divElement.setAttribute("aria-live", this.options.ariaLive);
    }

    if (this.options.node && this.options.node.nodeType === Node.ELEMENT_NODE) {
      divElement.appendChild(this.options.node);
    } else {
      if (this.options.escapeMarkup) {
        divElement.innerText = this.options.text!;
      } else {
        divElement.innerHTML = this.options.text!;
      }

      if (this.options.avatar !== "") {
        let avatarElement = document.createElement("img");
        avatarElement.src = this.options.avatar!;

        avatarElement.className = "toaster-avatar";

        if (this.options.position == "left") {
          divElement.appendChild(avatarElement);
        } else {
          divElement.insertAdjacentElement("afterbegin", avatarElement);
        }
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

      const width = window.innerWidth > 0 ? window.innerWidth : screen.width;

      if (this.options.position == "left" && width > 360) {
        divElement.insertAdjacentElement("afterbegin", closeElement);
      } else {
        divElement.appendChild(closeElement);
      }
    }

    if (this.options.stopOnFocus && this.options.duration! > 0) {
      divElement.addEventListener("mouseover", (event) => {
        window.clearTimeout((divElement as any).timeOutValue);
      });
      divElement.addEventListener("mouseleave", () => {
        (divElement as any).timeOutValue = window.setTimeout(() => {
          this._removeElement(divElement);
        }, this.options.duration);
      });
    }

    if (typeof this.options.destination !== "undefined") {
      divElement.addEventListener("click", (event) => {
        event.stopPropagation();
        if (this.options.newWindow === true) {
          window.open(this.options.destination!, "_blank");
        } else {
          window.location.href = this.options.destination!;
        }
      });
    }

    if (
      typeof this.options.onClick === "function" &&
      typeof this.options.destination === "undefined"
    ) {
      divElement.addEventListener("click", (event) => {
        event.stopPropagation();
        this.options.onClick!();
      });
    }

    if (typeof this.options.offset === "object") {
      const x = this._getAxisOffsetAValue("x", this.options);
      const y = this._getAxisOffsetAValue("y", this.options);

      const xOffset = this.options.position == "left" ? x : `-${x}`;
      const yOffset = this.options.gravity == "toaster-top" ? y : `-${y}`;

      divElement.style.transform = `translate(${xOffset},${yOffset})`;
    }

    return divElement;
  }

  private _removeElement(toastElement: HTMLElement) {
    toastElement.className = toastElement.className.replace(" on", "");

    window.setTimeout(() => {
      if (this.options.node && this.options.node.parentNode) {
        this.options.node.parentNode.removeChild(this.options.node);
      }

      if (toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }

      this.options.callback!.call(toastElement);

      this._reposition();
    }, 400);
  }

  private _reposition() {
    let topLeftOffsetSize = {
      top: 15,
      bottom: 15,
    };
    let topRightOffsetSize = {
      top: 15,
      bottom: 15,
    };
    let offsetSize = {
      top: 15,
      bottom: 15,
    };

    let allToasts = this._rootElement.querySelectorAll<HTMLElement>(".toaster");

    let classUsed: string;

    for (let i = 0; i < allToasts.length; i++) {
      if (allToasts[i].classList.contains("toaster-top") === true) {
        classUsed = "toaster-top";
      } else {
        classUsed = "toaster-bottom";
      }

      let height = allToasts[i].offsetHeight;
      classUsed = classUsed.substr(9, classUsed.length - 1);
      let offset = 15;

      let width = window.innerWidth > 0 ? window.innerWidth : screen.width;

      if (width <= 360) {
        allToasts[i].style[classUsed] = `${
          offsetSize[classUsed as "top" | "bottom"]
        }px`;

        offsetSize[classUsed as "top" | "bottom"] += height + offset;
      } else {
        if (allToasts[i].classList.contains("toaster-left") === true) {
          allToasts[i].style[classUsed] = `${
            topLeftOffsetSize[classUsed as "top" | "bottom"]
          }px`;

          topLeftOffsetSize[classUsed as "top" | "bottom"] += height + offset;
        } else {
          allToasts[i].style[classUsed] = `${
            topRightOffsetSize[classUsed as "top" | "bottom"]
          }px`;

          topRightOffsetSize[classUsed as "top" | "bottom"] += height + offset;
        }
      }
    }
  }

  private _getAxisOffsetAValue(
    axis: "x" | "y",
    options: ToasterConfigurationObject
  ) {
    if (options.offset && options.offset[axis] !== undefined) {
      if (isNaN(Number(options.offset[axis]))) {
        return options.offset[axis];
      } else {
        return `${options.offset[axis]}px`;
      }
    }

    return "0px";
  }
}

function StartToasterInstance(options: ToasterConfigurationObject): Toaster {
  return new Toaster(options);
}

export default StartToasterInstance;
