import Image from "next/image";

export function OptimizedSignImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
  imageClassName = "",
  quality = 60,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  quality?: 45 | 60 | 75 | 90;
}) {
  if (src.startsWith("data:")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`${className} ${imageClassName}`} />
    );
  }

  return (
    <span className={`relative block ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        quality={quality}
        className={imageClassName}
      />
    </span>
  );
}
