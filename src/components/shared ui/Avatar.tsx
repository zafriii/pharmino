"use client"

import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  children: React.ReactNode;
  className?: string;
}

export function Avatar({ children, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
    >
      {children}
    </div>
  );
}

interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export function AvatarImage({ src, alt, className }: AvatarImageProps) {
  const [loaded, setLoaded] = React.useState(false);

  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={cn("aspect-square h-full w-full object-cover", className)}
      onLoad={() => setLoaded(true)}
      style={{ display: loaded ? "block" : "none" }}
    />
  );
}

interface AvatarFallbackProps {
  children: React.ReactNode;
  className?: string;
}

export function AvatarFallback({ children, className }: AvatarFallbackProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-[#4a90e2] text-white font-xl",
        className
      )}
    >
      {children}
    </div>
  );
}