import React from 'react';

interface CardProps {
  children: React.ReactNode;
  type: 'NUMBER' | 'OPERATOR' | 'TARGET';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  count?: number; // How many left in deck
  small?: boolean;
  points?: number; // Added points prop
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  type, 
  onClick, 
  disabled = false, 
  className = '',
  count,
  small = false,
  points
}) => {
  const baseStyles = "relative flex items-center justify-center font-bold select-none transition-all duration-200 active:scale-95 shadow-lg border-b-4";
  
  const sizeStyles = small 
    ? "w-10 h-12 text-sm rounded-md border-b-2" 
    : "w-16 h-20 md:w-20 md:h-24 text-xl md:text-3xl rounded-xl";

  const typeStyles = {
    NUMBER: "bg-slate-700 text-white border-slate-900 hover:bg-slate-600 hover:border-slate-800",
    OPERATOR: "bg-indigo-600 text-white border-indigo-800 hover:bg-indigo-500 hover:border-indigo-700",
    TARGET: "bg-emerald-600 text-white border-emerald-800",
  };

  const disabledStyles = disabled 
    ? "opacity-40 cursor-not-allowed transform-none active:scale-100 filter grayscale" 
    : "cursor-pointer hover:-translate-y-1";

  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`
        ${baseStyles} 
        ${sizeStyles} 
        ${typeStyles[type]} 
        ${disabledStyles} 
        ${className}
      `}
    >
      <div className={small ? "transform translate-y-[-2px]" : "transform translate-y-[-4px]"}>
        {children}
      </div>
      
      {/* Points Display */}
      {points !== undefined && !disabled && (
        <div className={`absolute bottom-0.5 w-full text-center leading-none opacity-70 font-mono ${small ? 'text-[8px]' : 'text-[10px] md:text-xs'}`}>
          {points} pts
        </div>
      )}
      
      {/* Stock badge for numbers */}
      {count !== undefined && type === 'NUMBER' && !disabled && (
        <div className={`absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full ${count > 0 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
          {count}
        </div>
      )}
    </div>
  );
};