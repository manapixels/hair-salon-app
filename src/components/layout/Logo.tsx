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
    <div className="flex items-center gap-3 md:gap-1.5">
      <div className="relative h-12 w-12">
        <Image src="/images/logo.png" alt="Logo" fill className="h-full w-full" sizes="48px" />
      </div>
      {/* <span className="text-xl font-medium leading-[0.5] tracking-wide uppercase">S<span className="text-sm">ignature</span><br/>T<span className="text-sm">rims</span></span> */}
    </div>
  );
}
