import { createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { NAVBAR_CONSTANTS } from "./constants";

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

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={styles.mobileMenuBtn}
        onClick={() => send({ type: "OPEN" })}
        aria-label={text.mobileMenuLabel}
      >
        <Menu className={styles.menuIcon} />
      </Button>

      <Sheet open={open} onOpenChange={(o) => send({ type: o ? "OPEN" : "CLOSE" })}>
        <SheetContent side="left" className={styles.sheetContent}>
          <SheetHeader className="sr-only">
            <SheetTitle>{text.mobileNavTitle}</SheetTitle>
            <SheetDescription>{text.mobileNavDescription}</SheetDescription>
          </SheetHeader>
          <nav className={styles.navListOuter}>
            <div className={styles.navListTop}>
              <ul className={styles.navList}>
                {links.map((link) => {
                  const isActive = location.pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        onClick={() => send({ type: "CLOSE" })}
                        className={cn(
                          styles.navLinkBase,
                          isActive ? styles.navLinkActive : styles.navLinkInactive,
                        )}
                      >
                        {Icon && <Icon className={styles.navLinkIcon} />}
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className={styles.navFooter}>
              <Button variant="ghost" asChild className={styles.navFooterLink}>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => send({ type: "CLOSE" })}
                >
                  <Github className={styles.githubIcon} />
                  {text.githubLabel}
                </a>
              </Button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
