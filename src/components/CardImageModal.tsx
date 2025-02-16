import React from "react";
import { Card } from "../services/cardService";
import styles from "./CardImageModal.module.css";

interface CardImageModalProps {
  card: Card;
  onClose: () => void;
}

const CardImageModal: React.FC<CardImageModalProps> = ({ card, onClose }) => {
  return (
    <div
      data-testid="modal-backdrop"
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-75"
      style={{ zIndex: 1050 }}
      onClick={onClose}
    >
      <img
        src={card.imageUrl}
        alt={card.name}
        className={styles.modalImage}
        loading="lazy"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default CardImageModal;
