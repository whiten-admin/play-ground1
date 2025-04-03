import { theme } from '@/styles/theme';
import Image from 'next/image';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image 
        src="/images/logo.png"
        alt="devDash Logo"
        width={40}
        height={40}
        className="mr-2"
      />
      <span className="text-2xl font-bold text-gray-800">
        dev<span style={{ color: theme.colors.primary }}>Dash</span>
      </span>
    </div>
  );
} 