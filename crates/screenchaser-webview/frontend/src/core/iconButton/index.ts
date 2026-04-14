import "./index.css";

interface IconButtonProps {
  container?: null | Element;
  selector?: null | string;
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
  private svg: HTMLDivElement;
  private selector: string | null;
  private container: Element | null;
  private state: "stateOne" | "stateTwo" = "stateOne";
  private isDisabled: boolean = false;
  private spinningState: 'stopped' | 'spinning' | 'slowing' = 'stopped';
  private animationStartTime: number = 0;
  private animationFrame: number | null = null;
  private currentRotation: number = 0;
  private lastAngle: number = 0;
  private slowingStartTime: number = 0;
  private rotationSpeed: number = 180;
  private remainingAngle: number = 0;
  private slowdownDuration: number = 0;

  constructor(props: IconButtonProps) {
    this.stateOneIcon = props.stateOneIcon;
    this.stateTwoIcon = props.stateTwoIcon || props.stateOneIcon;
    this.stateOneStrokeColor = props.stateOneStrokeColor || "#eeeeee";
    this.stateTwoStrokeColor =
      props.stateTwoStrokeColor || props.stateOneStrokeColor;
    this.selector = props.selector || null;
    this.container = props.container || null;

    this.iconButton = document.createElement("button");
    this.iconButton.classList.add(buttonClassName);

    this.svg = document.createElement("div");
    this.svg.style.pointerEvents = "none";
    this.svg.style.display = "flex";
    this.svg.classList.add("icon");
    this.iconButton.appendChild(this.svg);

    this.loadSvgInline(this.stateOneIcon);

    this.iconButton.addEventListener("click", () => {
      if (this.isDisabled) return;
      
      this.state = this.state === "stateOne" ? "stateTwo" : "stateOne";
      const icon = this.state === "stateOne" ? this.stateOneIcon : this.stateTwoIcon;
      this.loadSvgInline(icon);
      if (props.onClick) {
        props.onClick(this.state);
      }
    });

    this.container =
      (this.selector ? document.querySelector(this.selector) : null) ||
      this.container ||
      null;
    if (!this.container) {
      throw new Error(
        `Element with selector ${this.selector} not found or provided container is null`
      );
    }
    this.container.appendChild(this.iconButton);
  }

  private async loadSvgInline(url: string) {
    try {
      const resp = await fetch(url);
      const text = await resp.text();
      this.svg.innerHTML = text;
      const svgEl = this.svg.querySelector("svg");
      if (svgEl) {
        const raw =
          this.state === "stateOne"
            ? this.stateOneStrokeColor
            : this.stateTwoStrokeColor;
        const color = raw.startsWith("var(")
          ? getComputedStyle(document.documentElement).getPropertyValue(
              raw.slice(4, -1)
            ).trim()
          : raw;
        svgEl.setAttribute("stroke", color);
      }
    } catch {
      // fallback: show nothing
    }
  }

  private animate(timestamp: number) {
    if (!this.animationStartTime) {
      this.animationStartTime = timestamp;
    }
    
    const elapsed = timestamp - this.animationStartTime;
    
    if (this.spinningState === 'spinning') {

      const msPerDegree = 1000 / this.rotationSpeed;
      this.currentRotation = -1 * (elapsed / msPerDegree) % 360;
      this.svg.style.transform = `rotate(${this.currentRotation}deg)`;
      
      this.lastAngle = this.currentRotation;
      
      this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    } 
    else if (this.spinningState === 'slowing') {
      if (!this.slowingStartTime) {
        this.slowingStartTime = timestamp;
        
        const currentAngle = this.lastAngle;
        const remainder = Math.abs(currentAngle) % 360;
        this.remainingAngle = remainder === 0 ? 0 : 360 - remainder;
        
        const msPerDegree = 1000 / this.rotationSpeed;
        const timeToCompleteCycle = this.remainingAngle * msPerDegree;
        
        this.slowdownDuration = Math.max(500, timeToCompleteCycle * 2.5);
      }
      
      const slowingElapsed = timestamp - this.slowingStartTime;
      
      if (slowingElapsed <= this.slowdownDuration) {
        const progress = slowingElapsed / this.slowdownDuration;
        
        const startingAngle = this.lastAngle;
        let targetAngle = 0;
        
        if (startingAngle < 0) {
          targetAngle = startingAngle - this.remainingAngle;
        }
        
        const easingFactor = Math.pow(1 - progress, 2);
        
        const angle = startingAngle * (1 - progress) + targetAngle * progress;
        
        const easedAngle = startingAngle * easingFactor + targetAngle * (1 - easingFactor);
        
        this.svg.style.transform = `rotate(${easedAngle}deg)`;
        this.animationFrame = requestAnimationFrame(this.animate.bind(this));
      } else {
        this.svg.style.transform = 'rotate(0deg)';
        this.spinningState = 'stopped';
        this.slowingStartTime = 0;
        this.currentRotation = 0;
        this.remainingAngle = 0;
        this.enable();
      }
    }
  }

  startSpin() {
    if (!document.getElementById('button-disabled-style')) {
      const style = document.createElement('style');
      style.id = 'button-disabled-style';
      style.textContent = `
        .button-disabled {
          opacity: 0.6;
          cursor: not-allowed !important;
        }
      `;
      document.head.appendChild(style);
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.spinningState = 'spinning';
    this.animationStartTime = 0;
    this.slowingStartTime = 0;
    this.currentRotation = 0;
    this.lastAngle = 0;
    this.remainingAngle = 0;
    
    this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    this.disable();
  }

  stopSpin() {
    if (this.spinningState === 'spinning') {
      this.spinningState = 'slowing';
      this.slowingStartTime = 0;
    }
  }

  disable() {
    this.isDisabled = true;
    this.iconButton.classList.add('button-disabled');
    this.iconButton.setAttribute('disabled', 'true');
  }

  enable() {
    this.isDisabled = false;
    this.iconButton.classList.remove('button-disabled');
    this.iconButton.removeAttribute('disabled');
  }
}

export default IconButton;
