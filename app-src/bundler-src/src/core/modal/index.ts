import "./modal.css";
import IconButton from "@core/IconButton";
import closeIcon from "@core/icons/x.svg";

class Modal {
  modalBackdrop: HTMLDivElement;
  modalContent: HTMLDivElement;
  modalWrapper: HTMLDivElement;
  modalHeader: HTMLDivElement;
  closeIconBtn: IconButton;

  constructor(title: string = "Modal") {
    this.modalBackdrop = document.createElement("div");
    this.modalBackdrop.classList.add("modal-backdrop");
    this.modalWrapper = document.createElement("div");
    this.modalWrapper.classList.add("modal-wrapper");
    this.modalContent = document.createElement("div");
    this.modalContent.classList.add("modal-content");
    this.modalHeader = document.createElement("div");
    this.modalHeader.classList.add("modal-header");
    this.modalHeader.innerHTML = title;

    this.modalBackdrop.appendChild(this.modalWrapper);
    this.modalWrapper.appendChild(this.modalContent);
    this.modalContent.appendChild(this.modalHeader);
    document.body.appendChild(this.modalBackdrop);

    this.modalBackdrop.addEventListener("click", (event) => {
      if (event.target === this.modalWrapper) {
        this.close();
      }
    });

    this.closeIconBtn = new IconButton({
      selector: ".modal-header",
      stateOneIcon: closeIcon,
      stateTwoIcon: closeIcon,
      stateOneStrokeColor: "#888",
      stateTwoStrokeColor: "#888",
      onClick: () => {
        this.close();
      },
    });
  }

  public open(): void {
    this.modalBackdrop.style.display = "block";
  }

  public close(): void {
    this.modalBackdrop.style.display = "none";
  }

  public setContent(content: string): void {
    this.modalBackdrop.innerHTML = content;
  }
}

export default Modal;
