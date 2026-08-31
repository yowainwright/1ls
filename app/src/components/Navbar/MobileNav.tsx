import { createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { NAVBAR_CONSTANTS } from "./constants";
import type { LucideIcon } from "lucide-react";

const { styles, text, links, githubUrl } = NAVBAR_CONSTANTS;

const drawerMachine = createMachine({
  id: "drawer",
  initial: "closed",
  states: {
    closed: { on: { OPEN: "open" } },
    open: { on: { CLOSE: "closed" } },
  },
});

export function MobileNav() {
  const [snapshot, send] = useMachine(drawerMachine);
  const open = snapshot.matches("open");
  const location = useLocation();
  const closeDrawer = () => send({ type: "CLOSE" });

  return (
    <>
      <MobileMenuButton onOpen={() => send({ type: "OPEN" })} />

      <Sheet open={open} onOpenChange={(o) => send({ type: o ? "OPEN" : "CLOSE" })}>
        <SheetContent side="left" className={styles.sheetContent}>
          <SheetHeader className="sr-only">
            <SheetTitle>{text.mobileNavTitle}</SheetTitle>
            <SheetDescription>{text.mobileNavDescription}</SheetDescription>
          </SheetHeader>
          <nav className={styles.navListOuter}>
            <MobileNavList pathname={location.pathname} onNavigate={closeDrawer} />
            <MobileGithubLink onNavigate={closeDrawer} />
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MobileMenuButton({ onOpen }: { onOpen: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={styles.mobileMenuBtn}
      onClick={onOpen}
      aria-label={text.mobileMenuLabel}
    >
      <Menu className={styles.menuIcon} />
    </Button>
  );
}

function MobileNavList({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <div className={styles.navListTop}>
      <ul className={styles.navList}>
        {links.map((link) => (
          <MobileNavItem
            key={link.href}
            href={link.href}
            icon={link.icon}
            isActive={pathname === link.href}
            label={link.label}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </div>
  );
}

function MobileNavItem({
  href,
  icon: Icon,
  isActive,
  label,
  onNavigate,
}: {
  href: string;
  icon?: LucideIcon;
  isActive: boolean;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        to={href}
        onClick={onNavigate}
        className={cn(styles.navLinkBase, isActive ? styles.navLinkActive : styles.navLinkInactive)}
      >
        {Icon && <Icon className={styles.navLinkIcon} />}
        {label}
      </Link>
    </li>
  );
}

function MobileGithubLink({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className={styles.navFooter}>
      <Button variant="ghost" asChild className={styles.navFooterLink}>
        <a href={githubUrl} target="_blank" rel="noopener noreferrer" onClick={onNavigate}>
          <Github className={styles.githubIcon} />
          {text.githubLabel}
        </a>
      </Button>
    </div>
  );
}
