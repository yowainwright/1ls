import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FORMATS } from "../../-constants";

export function FormatsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/10">
          <TableHead className="py-2 pr-4 font-medium">Format</TableHead>
          <TableHead className="py-2 pr-4 font-medium">Description</TableHead>
          <TableHead className="py-2 font-medium">Auto-detect</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="text-muted-foreground">
        {FORMATS.map((f) => (
          <TableRow key={f.format} className="border-border/10">
            <TableCell className="py-2 pr-4 font-mono text-primary">{f.format}</TableCell>
            <TableCell className="py-2 pr-4">{f.description}</TableCell>
            <TableCell className="py-2">{f.autoDetect ? "✓" : "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
