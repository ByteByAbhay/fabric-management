import React from 'react';

const Card = ({
  children,
  title,
  className = '',
  titleClassName = '',
  bodyClassName = '',
  footerClassName = '',
  footer,
  noPadding = false
}) => {
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {title && (
        <div className={`px-6 py-4 border-b border-gray-200 ${titleClassName}`}>
          {typeof title === 'string' ? (
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          ) : (
            title
          )}
        </div>
      )}
      
      <div className={`${noPadding ? '' : 'p-6'} ${bodyClassName}`}>
        {children}
      </div>
      
      {footer && (
        <div className={`bg-gray-50 px-6 py-3 border-t border-gray-200 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card; 