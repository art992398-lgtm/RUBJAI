export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Rubjai logo"
    >
      <defs>
        <linearGradient id="rj-g" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0" stopColor="#ff8bb8" />
          <stop offset="1" stopColor="#f76ba3" />
        </linearGradient>
      </defs>
      {/* wallet body */}
      <rect x="6" y="16" width="52" height="38" rx="10" fill="url(#rj-g)" />
      <rect x="6" y="16" width="52" height="38" rx="10" fill="white" fillOpacity="0.12" />
      {/* wallet flap */}
      <path
        d="M6 26c0-5.523 4.477-10 10-10h30l-6 10H6z"
        fill="#ffd3e5"
      />
      {/* coin slot / clasp */}
      <circle cx="47" cy="35" r="6" fill="#fff5f9" />
      <circle cx="47" cy="35" r="2.4" fill="#e84c8a" />
      {/* up arrow (income) */}
      <path
        d="M20 44V32m0 0l-4 4m4-4l4 4"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* down arrow (expense) */}
      <path
        d="M31 32v12m0 0l-4-4m4 4l4-4"
        stroke="#fff5f9"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}
