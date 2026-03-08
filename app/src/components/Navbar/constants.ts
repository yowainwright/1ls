import { Home, FileText, Play } from "lucide-react";
import type { NavLink } from "./types";

const styles = {
  nav: "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
  bgTop: "bg-transparent transition-all duration-300",
  bgScrolled:
    "bg-background/80 backdrop-blur-lg shadow-sm border-b border-border/10 transition-all duration-300",
  inner: "container mx-auto flex items-center justify-between h-16 px-4 md:px-8",
  logoLink: "flex items-center",
  logoText: "text-xl font-bold tracking-tighter",
  links: "hidden md:flex items-center gap-6",
  linkActive: "text-sm font-medium transition-colors text-foreground",
  linkInactive: "text-sm font-medium transition-colors text-muted-foreground hover:text-foreground",
  githubBtn:
    "flex items-center justify-center h-9 w-9 rounded-lg text-accent transition-colors hover:text-accent/80 hover:bg-accent/10",
  githubIcon: "h-5 w-5",
  mobileMenuBtn: "md:hidden h-9 w-9",
  menuIcon: "h-5 w-5",
  sheetContent: "w-72 p-0",
  navListOuter: "flex flex-col h-full",
  navListTop: "flex-1 pt-12 pb-6",
  navList: "flex flex-col gap-1 px-4",
  navLinkBase: "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
  navLinkActive: "bg-accent text-accent-foreground",
  navLinkInactive: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  navLinkIcon: "h-5 w-5",
  navFooter: "border-t px-4 py-4",
  navFooterLink:
    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
};

const text = {
  githubLabel: "GitHub",
  mobileMenuLabel: "Open menu",
  mobileNavTitle: "Navigation Menu",
  mobileNavDescription: "Site navigation links",
};

const links: NavLink[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/docs", label: "Docs", icon: FileText },
  { href: "/playground", label: "Playground", icon: Play },
];

const githubUrl = "https://github.com/yowainwright/1ls";

export const NAVBAR_CONSTANTS = { styles, text, links, githubUrl };

export const NAV_LINKS = links;
export const GITHUB_URL = githubUrl;
