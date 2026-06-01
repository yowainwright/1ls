import type { LucideIcon } from "lucide-react";

export interface FooterProps {
  className?: string;
}

export interface FooterLinkProps {
  href: string;
  label: string;
  Icon: LucideIcon;
}
