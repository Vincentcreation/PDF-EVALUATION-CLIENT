/** Elevate Fitness wordmark with mountain icon — matches the brand's mountain peak motif */
export default function ElevateLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Elevate Fitness"
    >
      {/* Mountain peaks */}
      <polygon points="18,4 10,20 26,20" fill="#D4AF37" />
      <polygon points="26,10 20,20 32,20" fill="#E8C84E" opacity="0.8" />
      <polygon points="10,13 4,20 16,20" fill="#B8960F" opacity="0.6" />
      {/* Base / horizon line */}
      <rect x="2" y="20" width="32" height="2" rx="1" fill="#D4AF37" opacity="0.4" />
    </svg>
  );
}
