import "./index.css";
import InfoIcon from "@core/icons/info-hexagon.svg";

enum ToastTypes {
  INFO = "info",
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
}

type ToasterConfigurationObject = {
  text?: string;
  node?: HTMLElement;
  duration?: number;
  selector?: string | HTMLElement | ShadowRoot;
  position?: string;
  icon?: string;
  type?: ToastTypes;
  callback?: () => void;
  onClick?: () => void;
  ariaLive?: string;
};

const toaster = document.createElement("div");
toaster.className = "toaster";
document.body.appendChild(toaster);

export type ToastHistoryEntry = { text: string; type: ToastTypes; time: Date };
const history: ToastHistoryEntry[] = [];
const MAX_HISTORY = 50;

export function getToastHistory(): readonly ToastHistoryEntry[] {
  return history;
}

class Toaster {
  defaults: ToasterConfigurationObject = {
    text: "Toaster is awesome!",
    node: undefined,
    duration: 4000,
    selector: undefined,
    callback: () => {},
    position: "",
    icon: InfoIcon,
    type: ToastTypes.INFO,
    onClick: () => {},
    ariaLive: "polite",
  };

  options: ToasterConfigurationObject = {};
  toastTypes = ToastTypes;
  toastElement: HTMLElement | null = null;
  private _rootElement: HTMLElement | ShadowRoot = document.body;

  constructor(options: ToasterConfigurationObject) {
    this._init(options);
  }

  showToast(): Toaster {
    history.push({
      text: this.options.text || "",
      type: this.options.type || ToastTypes.INFO,
      time: new Date(),
    });
    if (history.length > MAX_HISTORY) history.shift();

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
      const iconWrapper = document.createElement("div");
      iconWrapper.style.pointerEvents = "none";
      iconWrapper.style.display = "flex";
      iconWrapper.classList.add("icon");
      divElement.appendChild(iconWrapper);
      fetch(this.options.icon!)
        .then((r) => r.text())
        .then((text) => {
          iconWrapper.innerHTML = text;
          const svgEl = iconWrapper.querySelector("svg");
          if (svgEl) {
            svgEl.setAttribute("stroke", this.getTypeColor(this.options.type!));
          }
        })
        .catch(() => {});

      let textElement = document.createElement("span");
      textElement.innerHTML = this.options.text!;
      divElement.appendChild(textElement);
    }

    if (this.options.duration! > 0) {
      divElement.addEventListener("mouseover", () => {
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

  private getTypeColor(type: ToastTypes): string {
    switch (type) {
      case ToastTypes.INFO:
        return "#6272a4";
      case ToastTypes.SUCCESS:
        return "#50fa7b";
      case ToastTypes.ERROR:
        return "#ff5555";
      case ToastTypes.WARNING:
        return "#f1fa8c";
      default:
        return "#6272a4";
    }
  }
}

function StartToasterInstance(options: ToasterConfigurationObject): Toaster {
  return new Toaster(options);
}

export { ToastTypes };
export default StartToasterInstance;
