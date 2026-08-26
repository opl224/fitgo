import React from 'react';
import { griddyRegistry, IconName } from '../utils/griddyIcons';

interface GriddyIconProps {
  /** Name of the icon from the griddyRegistry */
  name: IconName;
  /** Size of the icon in pixels (default: 24) */
  size?: number | string;
  /** Color of the icon (CSS color string) */
  color?: string;
  /** Additional CSS classes for styling */
  className?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Optional stroke width (if supported by the icon library) */
  strokeWidth?: number;
  /** Optional inline styles for the wrapper */
  style?: React.CSSProperties;
  /** Optional opacity for the wrapper */
  opacity?: number;
  /** Whether the icon should be filled/solid (if supported) */
  filled?: boolean;
}

/**
 * Reusable GriddyIcon component for consistent icon rendering across the app.
 * Utilizes the griddy-icons library with a centralized registry.
 */
export const GriddyIcon: React.FC<GriddyIconProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  className = '',
  onClick,
  strokeWidth = 2,
  style,
  opacity,
  filled,
}) => {
  const IconComponent = griddyRegistry[name];

  if (!IconComponent) {
    console.warn(`GriddyIcon: Icon "${name}" not found in registry.`);
    return null;
  }

  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        opacity: opacity !== undefined ? opacity : undefined,
        ...style 
      }}
    >
      <IconComponent 
        size={size} 
        color={color} 
        strokeWidth={strokeWidth}
        // @ts-ignore - Some icons might support filled/weight props
        variant={filled ? 'solid' : 'outline'}
        // Spread any other props if the library supports them
      />
    </div>
  );
};

export default GriddyIcon;
