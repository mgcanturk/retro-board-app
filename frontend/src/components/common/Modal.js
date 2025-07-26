import React from 'react';
import { modalStyles } from '../../utils/styles';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div className={modalStyles.container} onClick={(e) => e.stopPropagation()}>
        {title && (
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal; 