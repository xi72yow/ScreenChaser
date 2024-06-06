import "./modal.css";
import IconButton from "@core/IconButton";
import closeIcon from "@core/icons/x.svg";

class Modal {
  modalBackdrop: HTMLDivElement;
  modalContent: HTMLDivElement;
  modalWrapper: HTMLDivElement;
  modalHeader: HTMLDivElement;
  closeIconBtn: IconButton;
  modal: HTMLDivElement;

  constructor(title: string = "Modal") {
    this.modal = document.createElement("div");
    this.modalBackdrop = document.createElement("div");
    this.modalBackdrop.classList.add("modal-backdrop");
    this.modalWrapper = document.createElement("div");
    this.modalWrapper.classList.add("modal-wrapper");
    this.modalContent = document.createElement("div");
    this.modalContent.classList.add("modal-content");
    this.modalHeader = document.createElement("div");
    this.modalHeader.classList.add("modal-header");
    this.modalHeader.innerHTML = title;

    this.modal.appendChild(this.modalBackdrop);
    this.modal.appendChild(this.modalWrapper);
    this.modalWrapper.appendChild(this.modalContent);
    this.modalContent.appendChild(this.modalHeader);
    document.body.appendChild(this.modal);

    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modalWrapper) {
        this.close();
      }
    });

    this.modal.style.display = "none";

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
    this.modal.style.display = "block";
  }

  public close(): void {
    this.modal.style.display = "none";
  }

  public toggle(): void {
    if (this.modal.style.display === "none") {
      this.open();
    } else {
      this.close();
    }
  }

  public setContent(content: string): void {
    this.modalContent.innerHTML = content;
  }
}

export default Modal;
