import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeImageSrc(imagePath?: string | null, fallback = "") {
  if (typeof imagePath !== "string") {
    return fallback;
  }

  const trimmedPath = imagePath.trim();
  if (!trimmedPath) {
    return fallback;
  }

  const repairedPath = trimmedPath
    .replace(/^\/+((?:https?:\/\/).*)$/i, "$1")
    .replace(/^https:\/(?!\/)/i, "https://")
    .replace(/^http:\/(?!\/)/i, "http://");

  if (/^https?:\/\//i.test(repairedPath) || repairedPath.startsWith("blob:")) {
    return repairedPath;
  }

  return `/${repairedPath.replace(/^\/+/, "")}`;
}

export function isRemoteImageSrc(imagePath?: string | null) {
  const normalizedPath = normalizeImageSrc(imagePath);
  return /^(https?:\/\/|blob:)/i.test(normalizedPath);
}
