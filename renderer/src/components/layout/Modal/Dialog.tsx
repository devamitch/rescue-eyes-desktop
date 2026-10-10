import React, { useEffect } from 'react';
// @ts-ignore
import Modal from 'react-modal';
import { X } from 'lucide-react';
import styles from './dialog.module.css';
import { ModalProps } from '@/types';



const Dialog : React.FC<ModalProps> = ({ isOpen, onClose, children, footer }) => {
  useEffect(() => {
      Modal.setAppElement('body');
  }, []);


  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className={styles.modal}
      overlayClassName={styles.modalOverlay}
    >
      <div className={styles.modalHeader}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className={styles.modalContent}>
        {children}
      </div>

      {footer && (
        <div className={styles.modalFooter}>
          {footer}
        </div>
      )}
    </Modal>
  );
};

export default Dialog;
