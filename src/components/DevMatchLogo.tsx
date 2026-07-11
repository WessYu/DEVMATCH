export function DevMatchLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-label="DevMatch"
      className={className}
      fill="none"
      role="img"
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="96" height="96" rx="24" fill="#111111" />
      <path
        d="M24 28C24 23.5817 27.5817 20 32 20H64C68.4183 20 72 23.5817 72 28V68C72 72.4183 68.4183 76 64 76H32C27.5817 76 24 72.4183 24 68V28Z"
        stroke="#F4F1EB"
        strokeWidth="5"
      />
      <path
        d="M36 36H48C55.1797 36 61 41.8203 61 49C61 56.1797 55.1797 62 48 62H36V36Z"
        stroke="#67E8F9"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <path
        d="M36 36L60 62"
        stroke="#67E8F9"
        strokeLinecap="round"
        strokeWidth="5"
      />
      <path
        d="M69 25L74 20L79 25"
        stroke="#F4F1EB"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
    </svg>
  );
}
