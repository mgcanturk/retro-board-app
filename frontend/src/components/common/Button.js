import React from 'react';
import { buttonStyles } from '../../utils/styles';

const Button = ({ 
  variant = 'primary', 
  size = 'normal',
  className = "",
  children,
  ...props 
}) => {
  const baseStyle = buttonStyles[variant] || buttonStyles.primary;
  const sizeStyle = size === 'small' ? buttonStyles.small : '';
  
  return (
    <button
      className={`${baseStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 