import { useEffect, useMemo } from "react";
import { setup, assign, fromCallback } from "xstate";
import { useMachine } from "@xstate/react";
import { useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: TocHeading[];
  className?: string;
}

const activeItemMachine = setup({
  types: {
    context: {} as { activeId: string | null; itemIds: string[] },
    input: {} as { itemIds: string[] },
    events: {} as { type: "ACTIVE"; id: string } | { type: "RESET"; itemIds: string[] },
  },
  actors: {
    intersectionObserver: fromCallback<{ type: "ACTIVE"; id: string }, { itemIds: string[] }>(
      ({ sendBack, input }) => {
        if (!input.itemIds.length) return;
        const io = new IntersectionObserver(
          (entries) => {
            const hit = entries.find((e) => e.isIntersecting);
            if (hit) sendBack({ type: "ACTIVE", id: hit.target.id });
          },
          { rootMargin: "0% 0% -80% 0%" },
        );
        input.itemIds.forEach((id) => {
          const el = document.getElementById(id);
          if (el) {
            io.observe(el);
          }
        });
        return () => io.disconnect();
      },
    ),
  },
}).createMachine({
  id: "activeItem",
  context: ({ input }) => ({ activeId: null, itemIds: input.itemIds }),
  initial: "tracking",
  states: {
    tracking: {
      invoke: { src: "intersectionObserver", input: ({ context }) => ({ itemIds: context.itemIds }) },
      on: {
        ACTIVE: { actions: assign({ activeId: ({ event }) => event.id }) },
        RESET: { target: "tracking", reenter: true, actions: assign({ itemIds: ({ event }) => event.itemIds, activeId: null }) },
      },
    },
  },
});

const headingsMachine = setup({
  types: {
    context: {} as { headings: TocHeading[] },
    events: {} as { type: "UPDATE" } | { type: "NAVIGATE" },
  },
  actors: {
    domObserver: fromCallback<{ type: "UPDATE" }>(({ sendBack }) => {
      sendBack({ type: "UPDATE" });
      const mo = new MutationObserver(() => sendBack({ type: "UPDATE" }));
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }),
  },
}).createMachine({
  id: "headings",
  context: { headings: [] },
  initial: "observing",
  states: {
    observing: {
      invoke: { src: "domObserver" },
      on: {
        UPDATE: {
          actions: assign({
            headings: () => {
              const elements = document.querySelectorAll("h2[id], h3[id], h4[id]");
              return Array.from(elements).map((el) => ({
                id: el.id,
                text: el.textContent ?? "",
                level: parseInt(el.tagName.charAt(1), 10),
              }));
            },
          }),
        },
        NAVIGATE: { target: "observing", reenter: true, actions: assign({ headings: [] }) },
      },
    },
  },
});

function useActiveItem(itemIds: string[]) {
  const [snapshot, send] = useMachine(activeItemMachine, { input: { itemIds } });
  useEffect(() => {
    send({ type: "RESET", itemIds });
  }, [itemIds]);
  return snapshot.context.activeId;
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const itemIds = useMemo(() => headings.map((h) => h.id), [headings]);
  const activeId = useActiveItem(itemIds);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Table of contents" className={className}>
      <h2 className="mb-4 text-sm font-semibold text-foreground">On this page</h2>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          const indentClass = heading.level === 2 ? "" : heading.level === 3 ? "pl-4" : "pl-6";

          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className={cn(
                  "block py-1 transition-colors",
                  indentClass,
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function useHeadings(): TocHeading[] {
  const location = useLocation();
  const [snapshot, send] = useMachine(headingsMachine);
  useEffect(() => {
    send({ type: "NAVIGATE" });
  }, [location.pathname]);
  return snapshot.context.headings;
}
