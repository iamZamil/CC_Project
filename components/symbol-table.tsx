import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SymbolTable as SymbolTableType } from "@/lib/types"

interface SymbolTableProps {
  symbolTable: SymbolTableType
}

export default function SymbolTable({ symbolTable }: SymbolTableProps) {
  const scopes = Object.keys(symbolTable)

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Symbol Table</h3>

      <Tabs defaultValue={scopes[0]} className="w-full">
        <TabsList className="mb-2">
          {scopes.map((scope) => (
            <TabsTrigger key={scope} value={scope}>
              {scope === "global" ? "Global Scope" : scope}
            </TabsTrigger>
          ))}
        </TabsList>

        {scopes.map((scope) => (
          <TabsContent key={scope} value={scope}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Line</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(symbolTable[scope]).map(([name, info]) => (
                  <TableRow key={name}>
                    <TableCell className="font-mono">{name}</TableCell>
                    <TableCell>{info.type}</TableCell>
                    <TableCell>{info.kind}</TableCell>
                    <TableCell>{info.line}</TableCell>
                    <TableCell>
                      {info.kind === "function" && info.params && (
                        <span>Params: {info.params.map((p) => `${p.name}: ${p.type}`).join(", ")}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
