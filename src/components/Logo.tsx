import { Mrs_Sheppards, Playfair_Display } from 'next/font/google';

const mrsSheppards = Mrs_Sheppards({
  weight: '400',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
});

interface LogoProps {
  className?: string;
  signatureText?: string;
  trimsText?: string;
}

export default function Logo({
  className = '',
  signatureText = 'Signature',
  trimsText = 'Trims',
}: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 100"
      className={className}
      aria-label={`${signatureText} ${trimsText}`}
    >
      {/* "Signature" in a script-like style */}
      <text
        x="150"
        y="55"
        className={mrsSheppards.className}
        fontSize="60"
        fill="currentColor"
        textAnchor="middle"
        fontStyle="italic"
      >
        {signatureText}
      </text>

      {/* "Trims" in a clean serif style */}
      <text
        x="170"
        y="90"
        className={playfair.className}
        fontSize="26"
        fill="currentColor"
        textAnchor="middle"
        letterSpacing="4"
        style={{ textTransform: 'uppercase' }}
      >
        {trimsText}
      </text>
    </svg>
  );
}
