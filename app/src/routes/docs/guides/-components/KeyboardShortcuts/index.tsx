import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SHORTCUTS } from "./constants";

export function KeyboardShortcuts() {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/10">
          <TableHead className="py-2 pr-4 font-medium">Key</TableHead>
          <TableHead className="py-2 font-medium">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="text-muted-foreground">
        {SHORTCUTS.map((shortcut) => (
          <TableRow key={shortcut.key} className="border-border/10">
            <TableCell className="py-2 pr-4 font-mono">{shortcut.key}</TableCell>
            <TableCell className="py-2">{shortcut.action}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
