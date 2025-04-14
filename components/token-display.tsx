import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Token } from "@/lib/types"

interface TokenDisplayProps {
  tokens: Token[]
}

export default function TokenDisplay({ tokens }: TokenDisplayProps) {
  return (
    <div className="overflow-auto">
      <h3 className="text-lg font-medium mb-2">Tokens</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Line</TableHead>
            <TableHead>Column</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token, index) => (
            <TableRow key={index}>
              <TableCell className="font-mono">{token.type}</TableCell>
              <TableCell className="font-mono">{token.value}</TableCell>
              <TableCell>{token.line}</TableCell>
              <TableCell>{token.column}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
