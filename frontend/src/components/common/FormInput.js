import React from 'react';
import { inputStyles } from '../../utils/styles';

const FormInput = React.forwardRef(({ 
  label, 
  required = false, 
  error, 
  className = "", 
  ...props 
}, ref) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`${inputStyles} ${className}`}
        {...props}
      />
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput; 