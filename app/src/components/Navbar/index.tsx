import { setup, fromCallback } from "xstate";
import { useMachine } from "@xstate/react";
import { NavLogo, NavLinks, GithubButton } from "./components";
import { MobileNav } from "./MobileNav";
import { NAVBAR_CONSTANTS } from "./constants";
import type { NavbarProps } from "./types";

const { styles } = NAVBAR_CONSTANTS;

const SCROLL_THRESHOLD = 20;
const scrollEventType = () => (window.scrollY > SCROLL_THRESHOLD ? "SCROLLED" : "TOP") as const;

const navbarMachine = setup({
  actors: {
    scrollListener: fromCallback(({ sendBack }) => {
      const handler = () => sendBack({ type: scrollEventType() });
      window.addEventListener("scroll", handler);
      handler();
      return () => window.removeEventListener("scroll", handler);
    }),
  },
}).createMachine({
  id: "navbar",
  initial: "top",
  invoke: { src: "scrollListener" },
  states: {
    top: { on: { SCROLLED: "scrolled" } },
    scrolled: { on: { TOP: "top" } },
  },
});

export function Navbar({ className = "" }: NavbarProps) {
  const [snapshot] = useMachine(navbarMachine);
  const isScrolled = snapshot.matches("scrolled");
  const bgClasses = isScrolled ? styles.bgScrolled : styles.bgTop;

  return (
    <nav className={`${styles.nav} ${className}`}>
      <div className={bgClasses}>
        <div className={styles.inner}>
          <div className="md:hidden">
            <MobileNav />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <NavLogo />
          </div>
          <NavLinks />
          <div className="hidden md:block">
            <GithubButton />
          </div>
          <div className="md:hidden w-9" aria-hidden="true" />
        </div>
      </div>
    </nav>
  );
}
