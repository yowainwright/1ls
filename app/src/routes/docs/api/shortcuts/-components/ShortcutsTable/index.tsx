import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SHORTCUTS } from "../../-constants";

export function ShortcutsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/10">
          <TableHead className="py-2 pr-8 font-medium">Shortcut</TableHead>
          <TableHead className="py-2 font-medium">Expands To</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="text-muted-foreground">
        {SHORTCUTS.map((s) => (
          <TableRow key={s.shortcut} className="border-border/10">
            <TableCell className="py-2 pr-8 font-mono text-primary">{s.shortcut}</TableCell>
            <TableCell className="py-2 font-mono">{s.expands}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
