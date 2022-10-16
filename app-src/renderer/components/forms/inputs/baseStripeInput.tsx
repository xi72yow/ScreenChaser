import { Button, ColorPicker, Modal } from "@mantine/core";
import { IconPalette } from "@tabler/icons";
import React, { useState, useRef, useEffect } from "react";
import BaseStripeCanvas from "./baseStripeCanvas";

export default function BaseStripeInput() {
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <Modal
        fullScreen
        sx={{ opacity: 0.95 }}
        opened={open}
        onClose={() => setOpen(false)}
        title="BaseStripe Creator"
      >
        <BaseStripeCanvas></BaseStripeCanvas>

        <ColorPicker
          sx={{ float: "right", paddingTop: "0.5rem" }}
          format="hex"
          swatches={[
            "#25262b",
            "#868e96",
            "#fa5252",
            "#e64980",
            "#be4bdb",
            "#7950f2",
            "#4c6ef5",
            "#228be6",
            "#15aabf",
            "#12b886",
            "#40c057",
            "#82c91e",
            "#fab005",
            "#fd7e14",
          ]}
        />
      </Modal>
      <Button
        sx={{ marginTop: "0.5rem" }}
        onClick={() => {
          setOpen(true);
        }}
        rightIcon={<IconPalette />}
      >
        BaseStripe
      </Button>

      <div>BaseStripeInput</div>
    </React.Fragment>
  );
}
