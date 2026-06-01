import { createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DOCS_NAV } from "./constants";
import type { DesktopSidebarProps, SidebarNavContentProps, SidebarSectionProps, SidebarNavItemProps } from "./types";

const sectionMachine = createMachine({
  id: "section",
  initial: "open",
  states: {
    open: { on: { TOGGLE: "closed" } },
    closed: { on: { TOGGLE: "open" } },
  },
});

export function DocsSidebar() {
  const location = useLocation();

  return <DesktopSidebar pathname={location.pathname} />;
}

function DesktopSidebar({ pathname }: DesktopSidebarProps) {
  return (
    <aside className="hidden md:block w-72 border-r border-border/10">
      <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pt-6 pb-12">
        <SidebarNavContent pathname={pathname} />
      </div>
    </aside>
  );
}

function SidebarNavContent({ pathname, onNavigate }: SidebarNavContentProps) {
  return (
    <nav className="px-4 space-y-6">
      {DOCS_NAV.map((section) => (
        <SidebarSection
          key={section.title}
          section={section}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function SidebarSection({ section, pathname, onNavigate }: SidebarSectionProps) {
  const [snapshot, send] = useMachine(sectionMachine);
  const isOpen = snapshot.matches("open");

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => send({ type: "TOGGLE" })}
        className="flex h-auto w-full items-center justify-between px-2 py-1.5 text-sm font-semibold text-foreground/70 uppercase tracking-wide hover:bg-transparent hover:text-foreground"
      >
        <span>{section.title}</span>
        <ChevronRight
          className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-90")}
        />
      </Button>
      {isOpen && (
        <div className="ml-2 mt-1 border-l-2 border-border/20">
          <ul className="space-y-1">
            {section.items.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SidebarNavItem({ item, pathname, onNavigate }: SidebarNavItemProps) {
  const isActive = pathname === item.href;

  return (
    <li>
      <Link
        to={item.href}
        onClick={onNavigate}
        className={cn(
          "block py-2 px-3 text-sm transition-colors relative",
          "hover:text-primary hover:bg-primary/10",
          isActive
            ? "text-primary bg-primary/10 font-medium before:absolute before:left-[-2px] before:top-0 before:bottom-0 before:w-0.5 before:bg-primary"
            : "text-foreground/70",
        )}
      >
        {item.title}
      </Link>
    </li>
  );
}
