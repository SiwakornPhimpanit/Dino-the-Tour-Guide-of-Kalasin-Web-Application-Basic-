type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

function UserIcon() {
  return (
    <svg className="userAvatarSvg" viewBox="0 0 24 24" aria-hidden focusable="false">
      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UserAvatar({ size = "md", className = "" }: Props) {
  const sizeClass =
    size === "sm" ? "userAvatarSm" : size === "lg" ? "userAvatarLg" : "userAvatarMd";

  return (
    <span
      className={`userAvatar userAvatarIcon ${sizeClass} ${className}`.trim()}
      aria-hidden
    >
      <UserIcon />
    </span>
  );
}
