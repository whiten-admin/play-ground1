import { theme } from '@/styles/theme';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        width="40" 
        height="40" 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2"
      >
        <rect width="40" height="40" rx="8" fill={theme.colors.primary} />
        <path 
          d="M12 10H28M20 10V30" 
          stroke="white" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
      <span className="text-2xl font-bold text-gray-800">
        Task<span style={{ color: theme.colors.primary }}>+</span>
      </span>
    </div>
  );
} 