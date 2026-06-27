import React from 'react';

const NeonButton = ({ children, className = '', ...props }) => {
  return (
    <button className={`neon-btn ${className}`} {...props}>
      {children}
    </button>
  );
};

export default NeonButton;
