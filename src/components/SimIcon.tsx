const SimIcon = ({ className = "w-10 h-10" }: { className?: string }) => {
  return (
    <div className={`${className} rounded-lg bg-primary/10 flex items-center justify-center`}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="text-primary"
      >
        <rect
          x="4"
          y="2"
          width="16"
          height="20"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M8 14h2v2H8v-2Z"
          fill="currentColor"
        />
        <path
          d="M14 14h2v2h-2v-2Z"
          fill="currentColor"
        />
        <path
          d="M8 10h2v2H8v-2Z"
          fill="currentColor"
        />
        <path
          d="M14 10h2v2h-2v-2Z"
          fill="currentColor"
        />
        <path
          d="M11 10h2v6h-2v-6Z"
          fill="currentColor"
        />
        <path
          d="M4 6l4-4h8l4 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default SimIcon;
