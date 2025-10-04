import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props
}) => {
  // Variant styles
  const variantStyles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-indigo-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
    info: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    link: 'bg-transparent text-indigo-600 hover:text-indigo-700 hover:underline focus:ring-indigo-500 shadow-none',
  };
  
  // Size styles
  const sizeStyles = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base',
  };
  
  // Base styles
  let baseStyles = `inline-flex items-center justify-center border rounded-md font-medium shadow-sm
    focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
    ${variantStyles[variant] || variantStyles.primary}
    ${sizeStyles[size] || sizeStyles.md}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
    ${className}`;
    
  // Don't add border to non-secondary/ghost variants
  if (variant !== 'secondary' && variant !== 'ghost') {
    baseStyles += ' border-transparent';
  }
  
  // Icon spacing
  const iconElement = icon && (
    <span className={`${iconPosition === 'left' ? 'mr-2' : 'ml-2'}`}>
      {icon}
    </span>
  );
  
  // Content with icon
  const content = (
    <>
      {icon && iconPosition === 'left' && iconElement}
      {children}
      {icon && iconPosition === 'right' && iconElement}
    </>
  );
  
  // For regular button
  if (!to && !href) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={baseStyles}
        {...props}
      >
        {content}
      </button>
    );
  }
  
  // For React Router Link
  if (to) {
    return (
      <Link
        to={to}
        className={baseStyles}
        {...props}
      >
        {content}
      </Link>
    );
  }
  
  // For external link
  return (
    <a
      href={href}
      className={baseStyles}
      target={props.target || '_blank'}
      rel={props.rel || 'noopener noreferrer'}
      {...props}
    >
      {content}
    </a>
  );
};

export default Button; 