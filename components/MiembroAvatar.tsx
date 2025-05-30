import Image from "next/image";
import { User } from "lucide-react";

interface MiembroAvatarProps {
  foto?: string | null;
  nombre: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-20 h-20",
  xl: "w-32 h-32",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
  xl: "h-16 w-16",
};

export function MiembroAvatar({
  foto,
  nombre,
  size = "md",
  className = "",
}: MiembroAvatarProps) {
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  if (foto) {
    return (
      <div
        className={`${sizeClass} relative rounded-full overflow-hidden bg-muted ${className}`}
      >
        <Image
          src={foto}
          alt={`Foto de ${nombre}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-muted flex items-center justify-center ${className}`}
    >
      <User className={`${iconSize} text-muted-foreground`} />
    </div>
  );
}
