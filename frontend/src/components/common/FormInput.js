import React from 'react';
import { inputStyles } from '../../utils/styles';

const FormInput = ({ 
  label, 
  required = false, 
  error, 
  className = "", 
  ...props 
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        className={`${inputStyles} ${className}`}
        {...props}
      />
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};

export default FormInput; 