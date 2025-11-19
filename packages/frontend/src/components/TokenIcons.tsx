export function SeedIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="12" fill="oklch(0.45 0.15 142)" />
      <path
        d="M12 6C9.79 6 8 7.79 8 10C8 11.33 8.58 12.53 9.5 13.33V17C9.5 17.28 9.72 17.5 10 17.5H14C14.28 17.5 14.5 17.28 14.5 17V13.33C15.42 12.53 16 11.33 16 10C16 7.79 14.21 6 12 6Z"
        fill="white"
      />
      <path
        d="M12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8Z"
        fill="oklch(0.75 0.18 70)"
      />
    </svg>
  );
}

export function UsdcIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="12" fill="#2775CA" />
      <path
        d="M15.5 12.5C15.5 11.67 14.83 11 14 11H10C9.45 11 9 10.55 9 10C9 9.45 9.45 9 10 9H14.5V7H13V5.5H11V7H10C8.62 7 7.5 8.12 7.5 9.5C7.5 10.88 8.62 12 10 12H14C14.55 12 15 12.45 15 13C15 13.55 14.55 14 14 14H9.5V16H11V17.5H13V16H14C15.38 16 16.5 14.88 16.5 13.5C16.5 13.16 16.43 12.82 16.3 12.5H15.5Z"
        fill="white"
      />
    </svg>
  );
}

export function LpTokenIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.45 0.15 142)" />
          <stop offset="100%" stopColor="oklch(0.75 0.18 70)" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill="url(#lpGradient)" />
      <path
        d="M8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12M8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12M8 12H16"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="12" r="2" fill="white" />
      <circle cx="16" cy="12" r="2" fill="white" />
    </svg>
  );
}
