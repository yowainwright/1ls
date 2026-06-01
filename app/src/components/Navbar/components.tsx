import { Link, useLocation } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { LOGO_STYLES } from "@/lib/styles";
import { Button } from "@/components/ui/button";
import { NAVBAR_CONSTANTS } from "./constants";

const { styles, text, links, githubUrl } = NAVBAR_CONSTANTS;

export function NavLogo() {
  return (
    <Link to="/" className={styles.logoLink}>
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
    </Link>
  );
}

export function NavLinks() {
  const location = useLocation();

  return (
    <nav className={styles.links}>
      {links.map((link) => {
        const isActive = location.pathname === link.href;
        return (
          <Link
            key={link.href}
            to={link.href}
            className={isActive ? styles.linkActive : styles.linkInactive}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function GithubButton() {
  return (
    <Button variant="ghost" size="icon" asChild className={styles.githubBtn}>
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={text.githubLabel}
      >
        <Github className={styles.githubIcon} />
        <span className="sr-only">{text.githubLabel}</span>
      </a>
    </Button>
  );
}
