import "./index.css";
import IconButton from "@/core/iconButton";
import closeIcon from "@core/icons/x.svg";
import saveIcon from "@core/icons/device-floppy.svg";

class Modal {
  modalBackdrop: HTMLDivElement;
  modalContent: HTMLDivElement;
  modalWrapper: HTMLDivElement;
  modalHeader: HTMLDivElement;
  modalBody: HTMLDivElement;
  closeIconBtn: IconButton;
  saveIconBtn: IconButton;
  modal: HTMLDivElement;
  titleSpan: HTMLSpanElement;
  callBack: () => void;
  buttonSpace: any;

  constructor(title: string = "Modal") {
    this.modal = document.createElement("div");
    this.modalBackdrop = document.createElement("div");
    this.modalBackdrop.classList.add("modal-backdrop");
    this.modalWrapper = document.createElement("div");
    this.modalWrapper.classList.add("modal-wrapper");
    this.modalContent = document.createElement("div");
    this.modalContent.classList.add("modal-content");
    this.modalBody = document.createElement("div");
    this.modalBody.classList.add("modal-body");
    this.modalHeader = document.createElement("div");
    this.modalHeader.classList.add("modal-header");

    this.titleSpan = document.createElement("span");
    this.titleSpan.innerText = title;

    this.buttonSpace = document.createElement("div");
    this.buttonSpace.classList.add("button-space");

    this.modal.appendChild(this.modalBackdrop);
    this.modal.appendChild(this.modalWrapper);
    this.modalWrapper.appendChild(this.modalContent);
    this.modalContent.appendChild(this.modalHeader);
    this.modalHeader.appendChild(this.titleSpan);
    this.modalHeader.appendChild(this.buttonSpace);
    this.modalContent.appendChild(this.modalBody);
    document.body.appendChild(this.modal);

    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modalWrapper) {
        this.close();
      }
    });

    this.modal.style.display = "none";

    this.closeIconBtn = new IconButton({
      container: this.buttonSpace,
      stateOneIcon: closeIcon,
      stateTwoIcon: closeIcon,
      stateOneStrokeColor: "#888",
      stateTwoStrokeColor: "#888",
      onClick: () => {
        this.close();
      },
    });

    this.callBack = () => {
      console.log("Save button clicked");
    };

    this.saveIconBtn = new IconButton({
      container: this.buttonSpace,
      stateOneIcon: saveIcon,
      stateTwoIcon: saveIcon,
      stateOneStrokeColor: "#888",
      stateTwoStrokeColor: "#888",
      onClick: () => {
        this.callBack();
      },
    });
  }

  public onSave(callback: () => void): void {
    this.callBack = callback;
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

  setModalTitle(title: string): void {
    this.titleSpan.innerText = title;
  }

  public setContent(content: string): void {
    this.modalContent.innerHTML = content;
  }
}

export default Modal;
