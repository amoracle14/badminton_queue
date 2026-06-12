import Image from "next/image";
import Link from "next/link";

type IconButtonProps = {
  alt: string;
  href?: string;
  icon?: string;
  onClick?: () => void;
  children?: React.ReactNode;
};

const IconButton = ({
  alt,
  href,
  icon,
  onClick,
  children,
}: IconButtonProps) => {
  const className =
    "grid size-9 shrink-0 place-items-center rounded-full bg-white text-[var(--color-primary)] shadow-[0_8px_24px_rgba(29,137,228,0.08)]";
  const content = icon ? (
    <Image src={icon} alt={alt} width={24} height={24} />
  ) : children ? (
    children
  ) : null;

  if (href) {
    return (
      <Link href={href} aria-label={alt} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" aria-label={alt} onClick={onClick} className={className}>
      {content}
    </button>
  );
};

export default IconButton;
