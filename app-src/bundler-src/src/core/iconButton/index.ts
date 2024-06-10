import "./index.css";

interface IconButtonProps {
  selector: string;
  stateOneIcon: string;
  stateTwoIcon?: string;
  stateOneStrokeColor: string;
  stateTwoStrokeColor?: string;
  onClick?: (state: "stateOne" | "stateTwo") => void;
}

const buttonClassName = "base-icon-button";

class IconButton {
  private stateOneIcon: string;
  private stateTwoIcon: string;
  private stateOneStrokeColor: string;
  private stateTwoStrokeColor: string;
  private iconButton: HTMLButtonElement;
  private svg: HTMLObjectElement;
  private selector: string;
  private state: "stateOne" | "stateTwo" = "stateOne";

  constructor(props: IconButtonProps) {
    this.stateOneIcon = props.stateOneIcon;
    this.stateTwoIcon = props.stateTwoIcon || props.stateOneIcon;
    this.stateOneStrokeColor = props.stateOneStrokeColor || "#eeeeee";
    this.stateTwoStrokeColor =
      props.stateTwoStrokeColor || props.stateOneStrokeColor;
    this.selector = props.selector;

    this.iconButton = document.createElement("button");
    this.iconButton.classList.add(buttonClassName);

    this.svg = document.createElement("object");
    this.svg.style.pointerEvents = "none";
    this.svg.type = "image/svg+xml";
    this.svg.classList.add("icon");
    this.iconButton.appendChild(this.svg);

    this.svg.addEventListener("load", () => {
      const svgDoc = this.svg.contentDocument!;
      if (this.state === "stateOne") {
        svgDoc
          .querySelector("svg")!
          .setAttribute("stroke", this.stateTwoStrokeColor);
      } else {
        svgDoc
          .querySelector("svg")!
          .setAttribute("stroke", this.stateOneStrokeColor);
      }
    });

    this.svg.data = this.stateOneIcon;

    this.iconButton.addEventListener("click", () => {
      this.state = this.state === "stateOne" ? "stateTwo" : "stateOne";
      this.svg.data =
        this.state === "stateOne" ? this.stateOneIcon : this.stateTwoIcon;
      if (props.onClick) {
        props.onClick(this.state);
      }
    });

    document.body.querySelector(this.selector)!.appendChild(this.iconButton);
  }
}

export default IconButton;
