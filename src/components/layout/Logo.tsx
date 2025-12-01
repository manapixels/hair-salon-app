import { Playfair_Display } from 'next/font/google';
import Image from 'next/image';

const playfair = Playfair_Display({
  subsets: ['latin'],
});

interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <div className="flex items-center gap-3 md:gap-1">
      <div className="relative h-12 w-12">
        <Image src="/images/logo.png" alt="Logo" fill className="h-full w-full" sizes="48px" />
      </div>
      <span className="text-xl font-medium">SignatureTrims</span>
    </div>
  );
}
