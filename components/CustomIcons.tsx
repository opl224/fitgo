import React from 'react';

interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
  strokeWidth?: number;
  variant?: 'solid' | 'outline';
}

export const PlayFilled: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  variant = 'solid'
}) => {
  if (variant === 'outline') {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
      >
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    );
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={color} 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M7 4.5C6.44772 4.5 6 4.94772 6 5.5V18.5C6 19.0523 6.44772 19.5 7 19.5C7.21406 19.5 7.42289 19.4311 7.5947 19.3033L18.5947 12.8033C19.068 12.5233 19.221 11.9084 18.941 11.435C18.8604 11.2987 18.7412 11.1856 18.5997 11.104L7.59966 4.70404C7.42551 4.60309 7.22591 4.54972 7.0223 4.5501L7 4.5Z" 
      />
    </svg>
  );
};

export const PauseFilled: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  variant = 'solid'
}) => {
  if (variant === 'outline') {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
      >
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
      </svg>
    );
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={color} 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M9 5C9.55228 5 10 5.44772 10 6V18C10 18.5523 9.55228 19 9 19H7C6.44772 19 6 18.5523 6 18V6C6 5.44772 6.44772 5 7 5H9ZM17 5C17.5523 5 18 5.44772 18 6V18C18 18.5523 17.5523 19 17 19H15C14.4477 19 14 18.5523 14 18V6C14 5.44772 14.4477 5 15 5H17Z" 
      />
    </svg>
  );
};
