import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  showText = true 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* لوگو */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <img
          src="/assets/images/logo.png"
          alt="لوگو دستیار مستندساز هوشمند"
          className="h-full w-full object-contain"
          onError={(e) => {
            // اگر لوگو لود نشد، یک لوگوی پیش‌فرض نمایش داده شود
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="h-full w-full bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  AI
                </div>
              `;
            }
          }}
        />
      </div>
      
      {/* متن لوگو */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-extrabold text-slate-50 drop-shadow-sm ${textSizeClasses[size]}`}>
            پتروشیمی نوری
          </span>
          <span className="text-slate-200/80 whitespace-nowrap text-xs">
             دستیار مستندساز هوشمند
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
