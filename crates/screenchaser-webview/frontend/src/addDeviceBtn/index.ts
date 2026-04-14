import plusIcon from "@core/icons/plus.svg";
import IconButton from "@/core/iconButton";

import Modal from "@core/modal";

const modal = new Modal();

new IconButton({
  selector: ".app-footer",
  stateOneIcon: plusIcon,
  stateTwoIcon: plusIcon,
  stateOneStrokeColor: "#888",
  stateTwoStrokeColor: "#888",
  onClick: (state) => {
    modal.toggle();
  },
});
