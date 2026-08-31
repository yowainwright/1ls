import { Github, Package } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { LOGO_STYLES } from "@/lib/styles";
import { Button } from "@/components/ui/button";
import type { FooterProps, FooterLinkProps } from "./types";

const styles = {
  footer: "border-t border-border/10",
  container: "container mx-auto px-4 py-8",
  inner: "flex flex-col items-center justify-between gap-4 md:flex-row",
  left: "flex flex-col items-center md:items-start gap-2",
  logoText: "text-2xl font-bold tracking-tighter",
  credit: "text-sm text-muted-foreground",
  creditLink: "font-medium underline underline-offset-4 hover:text-foreground",
  copyright: "text-sm text-muted-foreground",
  links: "flex gap-4",
  link: "text-accent transition-colors hover:text-accent/80",
  linkIcon: "h-5 w-5",
};

const text = {
  credit: "Built by",
  creditAuthor: "Jeff Wainwright",
  creditHref: "https://jeffry.in",
  startYear: 2024,
};

function FooterLink({ href, label, Icon }: FooterLinkProps) {
  return (
    <Button variant="ghost" size="icon" asChild className="text-accent hover:text-accent/80 hover:bg-transparent">
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
        <Icon className={styles.linkIcon} />
      </a>
    </Button>
  );
}

export default function Footer({ className = "" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`${styles.footer} ${className}`}>
      <div className={styles.container}>
        <div className={styles.inner}>
          <FooterMeta currentYear={currentYear} />
          <FooterLinks />
        </div>
      </div>
    </footer>
  );
}

function FooterMeta({ currentYear }: { currentYear: number }) {
  return (
    <div className={styles.left}>
      <FooterLogo />
      <FooterCredit />
      <p className={styles.copyright}>
        © {text.startYear}–{currentYear} MIT License
      </p>
    </div>
  );
}

function FooterLogo() {
  return (
    <span className={styles.logoText} style={{ ...LOGO_STYLES, animation: undefined, filter: undefined }}>
      1ls
    </span>
  );
}

function FooterCredit() {
  return (
    <p className={styles.credit}>
      {text.credit}{" "}
      <a href={text.creditHref} target="_blank" rel="noopener noreferrer" className={styles.creditLink}>
        {text.creditAuthor}
      </a>
    </p>
  );
}

function FooterLinks() {
  return (
    <div className={styles.links}>
      <TrackingPixel />
      <FooterLink href={siteConfig.links.github} label="GitHub" Icon={Github} />
      <FooterLink href={siteConfig.links.npm} label="npm" Icon={Package} />
    </div>
  );
}

function TrackingPixel() {
  return (
    <img
      src="https://static.scarf.sh/a.png?x-pxid=500dd7ce-0f58-4763-b6a7-fc992b6a12cb"
      referrerPolicy="no-referrer-when-downgrade"
      aria-hidden="true"
      alt=""
      width={1}
      height={1}
      style={{ position: "absolute" }}
    />
  );
}
