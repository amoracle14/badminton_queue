import Image from "next/image";
import Link from "next/link";

type IconButtonProps = {
  alt: string;
  href?: string;
  icon?: string;
  children?: React.ReactNode;
};

export default function IconButton({
  alt,
  href,
  icon,
  children,
}: IconButtonProps) {
  const className =
    "grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#1597F5] shadow-[0_8px_24px_rgba(64,169,255,0.08)]";
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
    <button type="button" aria-label={alt} className={className}>
      {content}
    </button>
  );
}
