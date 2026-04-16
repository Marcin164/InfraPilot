import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import type { ComponentProps } from "react";

type ModalProps = ComponentProps<typeof Modal>;

const ANIM_CLASSES = {
  overlayAnimationIn: "modal-overlay-in",
  overlayAnimationOut: "modal-overlay-out",
  modalAnimationIn: "modal-slide-in",
  modalAnimationOut: "modal-slide-out",
};

const AnimatedModal = (props: ModalProps) => {
  const { classNames, ...rest } = props;
  return (
    <Modal
      {...rest}
      animationDuration={250}
      classNames={{
        ...classNames,
        ...ANIM_CLASSES,
      }}
    />
  );
};

export default AnimatedModal;
