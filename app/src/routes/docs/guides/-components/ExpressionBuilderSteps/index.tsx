import { Card, CardContent } from "@/components/ui/card";
import { STEPS } from "./constants";

export function ExpressionBuilderSteps() {
  return (
    <Card className="border-border/10 bg-muted/30 shadow-none">
      <CardContent className="p-4">
        <ol className="list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
          {STEPS.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
