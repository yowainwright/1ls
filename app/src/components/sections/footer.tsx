import { Github, Package } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { LOGO_STYLES } from "@/lib/styles";

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

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`${styles.footer} ${className}`}>
      <div className={styles.container}>
        <div className={styles.inner}>
          <div className={styles.left}>
            <span
              className={styles.logoText}
              style={{
                ...LOGO_STYLES,
                animation: undefined,
                filter: undefined,
              }}
            >
              1ls
            </span>
            <p className={styles.credit}>
              {text.credit}{" "}
              <a
                href={text.creditHref}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.creditLink}
              >
                {text.creditAuthor}
              </a>
            </p>
            <p className={styles.copyright}>
              © {text.startYear}–{currentYear} MIT License
            </p>
          </div>
          <div className={styles.links}>
            <img
              src="https://static.scarf.sh/a.png?x-pxid=500dd7ce-0f58-4763-b6a7-fc992b6a12cb"
              referrerPolicy="no-referrer-when-downgrade"
              aria-hidden="true"
              alt=""
              width={1}
              height={1}
              style={{ position: "absolute" }}
            />
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              aria-label="GitHub"
            >
              <Github className={styles.linkIcon} />
            </a>
            <a
              href={siteConfig.links.npm}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              aria-label="npm"
            >
              <Package className={styles.linkIcon} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
