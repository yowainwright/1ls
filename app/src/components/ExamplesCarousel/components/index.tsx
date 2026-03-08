import { Codeblock, CodeCard } from "@/components/Codeblock";
import { Badge } from "@/components/ui/badge";
import { EXAMPLES_CAROUSEL_CONSTANTS } from "../constants";
import type { SpotlightCardProps, SpotlightCardHeaderProps, SpotlightCardContentProps } from "../types";

const { styles, text } = EXAMPLES_CAROUSEL_CONSTANTS;

export function SpotlightCard({ example }: SpotlightCardProps) {
  return (
    <CodeCard className={styles.card}>
      <SpotlightCardHeader
        title={example.title}
        description={example.description}
        format={example.format}
      />
      <SpotlightCardContent
        input={example.input}
        output={example.output}
        command={example.command}
        language={example.language as Language}
      />
    </CodeCard>
  );
}

function SpotlightCardHeader({ title, description, format }: SpotlightCardHeaderProps) {
  return (
    <div className={styles.cardHeader}>
      <div className={styles.cardHeaderRow}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <Badge className={styles.cardBadge}>{format}</Badge>
      </div>
      <p className={styles.cardDescription}>{description}</p>
    </div>
  );
}

function SpotlightCardContent({ input, output, command, language }: SpotlightCardContentProps) {
  return (
    <div className={styles.cardContent}>
      <div>
        <div className={styles.label}>{text.inputLabel}</div>
        <Codeblock code={input} language={language} />
      </div>

      <div className={styles.commandWrap}>
        <div className={styles.commandInner}>
          <span className={styles.commandPrompt}>{text.commandPrefix}</span>{" "}
          <span className={styles.commandText}>{command}</span>
        </div>
      </div>

      <div>
        <div className={styles.label}>{text.outputLabel}</div>
        <Codeblock code={output} language="json" />
      </div>
    </div>
  );
}
