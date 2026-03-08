import { createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { EASE_CURVE, GRADIENT_HEADER_STYLES } from "@/lib/styles";
import { Github, Copy, Check } from "lucide-react";

const styles = {
  section:
    "relative flex min-h-[90vh] items-center justify-center overflow-hidden px-4 py-16 md:py-24",
  container: "container mx-auto max-w-5xl",
  inner: "flex flex-col items-center text-center",
  logoWrap: "mb-6 flex w-full justify-center",
  logo: "text-6xl sm:text-7xl md:text-8xl lg:text-9xl",
  h2: "mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl",
  p: "mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl",
  ctaRow: "flex flex-col items-center gap-4 sm:flex-row sm:items-center",
  primaryCta:
    "h-auto inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3 text-base font-medium text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg",
  primaryCtaIcon: "h-5 w-5",
  installCmd:
    "h-auto inline-flex items-center gap-3 rounded-lg border border-border/10 bg-card px-4 py-3 font-mono text-sm text-card-foreground shadow-md shadow-black/5 transition-all hover:bg-card/80 hover:text-card-foreground dark:shadow-black/20",
  installCode: "text-primary",
  copyIcon: "h-4 w-4 text-muted-foreground",
  copiedIcon: "h-4 w-4 text-green-400",
};

const INSTALL_COMMAND = "npm install -g 1ls";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: EASE_CURVE },
});

const copyMachine = createMachine({
  id: "copy",
  initial: "idle",
  states: {
    idle: { on: { COPY: "copied" } },
    copied: { after: { 2000: "idle" } },
  },
});

export default function Hero() {
  const [snapshot, send] = useMachine(copyMachine);
  const copied = snapshot.matches("copied");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(INSTALL_COMMAND);
    send({ type: "COPY" });
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.inner}>
          <div className={styles.logoWrap}>
            <Logo className={styles.logo} />
          </div>
          <motion.h2 className={styles.h2} {...fadeUp(0.2)} style={GRADIENT_HEADER_STYLES}>
            {siteConfig.hero.subtitle}
          </motion.h2>
          <motion.p className={styles.p} {...fadeUp(0.4)}>
            {siteConfig.hero.longDescription}
          </motion.p>
          <motion.div className={styles.ctaRow} {...fadeUp(0.6)}>
            <Button
              asChild
              className={styles.primaryCta}
              style={{
                background:
                  "linear-gradient(90deg, rgb(var(--primary)), rgb(var(--accent)), rgb(var(--primary)))",
                backgroundSize: "200% auto",
              }}
            >
              <a
                href={siteConfig.hero.secondaryCtaHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className={styles.primaryCtaIcon} />
                {siteConfig.hero.secondaryCta}
              </a>
            </Button>
            <Button variant="ghost" onClick={handleCopy} className={styles.installCmd}>
              <code className={styles.installCode}>{INSTALL_COMMAND}</code>
              {copied ? (
                <Check className={styles.copiedIcon} />
              ) : (
                <Copy className={styles.copyIcon} />
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
