"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { IRInstruction } from "@/lib/types"

interface IRDisplayProps {
  ir: IRInstruction[]
  optimizedIR?: IRInstruction[]
}

export default function IRDisplay({ ir, optimizedIR = ir }: IRDisplayProps) {
  // Remove the unused state declaration
  // const [showDiff, setShowDiff] = useState(false)

  // Calculate statistics
  const originalInstructions = ir.length
  const optimizedInstructions = optimizedIR.length
  const reductionPercentage = (((originalInstructions - optimizedInstructions) / originalInstructions) * 100).toFixed(1)

  const renderIR = (instructions: IRInstruction[], highlight = false) => {
    return (
      <div className="font-mono text-sm whitespace-pre overflow-x-auto">
        {instructions.map((instr, idx) => {
          const isRemoved =
            highlight &&
            !optimizedIR.some(
              (oi) =>
                oi.operation === instr.operation &&
                oi.result === instr.result &&
                oi.arg1 === instr.arg1 &&
                oi.arg2 === instr.arg2,
            )

          return (
            <div key={idx} className={`py-1 ${isRemoved ? "bg-red-100 line-through" : ""}`}>
              {instr.label && <span className="font-bold">{instr.label}: </span>}
              {instr.result && <span>{instr.result} = </span>}
              <span className="text-blue-600">{instr.operation}</span>
              {instr.arg1 && <span> {instr.arg1}</span>}
              {instr.arg2 && <span>, {instr.arg2}</span>}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Intermediate Representation</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle>Original IR</CardTitle>
            <CardDescription>Before optimization</CardDescription>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">{originalInstructions}</div>
            <div className="text-sm text-muted-foreground">Instructions</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <CardTitle>Optimized IR</CardTitle>
            <CardDescription>After optimization</CardDescription>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">{optimizedInstructions}</div>
            <div className="text-sm text-muted-foreground">Instructions</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <CardTitle>Improvement</CardTitle>
            <CardDescription>Size reduction</CardDescription>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">{reductionPercentage}%</div>
            <div className="text-sm text-muted-foreground">Reduction</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="original">
        <TabsList>
          <TabsTrigger value="original">Original IR</TabsTrigger>
          <TabsTrigger value="optimized">Optimized IR</TabsTrigger>
          <TabsTrigger value="diff">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="original" className="border rounded-md p-4 mt-2">
          {renderIR(ir)}
        </TabsContent>

        <TabsContent value="optimized" className="border rounded-md p-4 mt-2">
          {renderIR(optimizedIR)}
        </TabsContent>

        <TabsContent value="diff" className="border rounded-md p-4 mt-2">
          <div className="mb-2 text-sm text-muted-foreground">
            <span className="inline-block bg-red-100 px-2 py-1 mr-2 line-through">Removed instructions</span>
            <span className="inline-block px-2 py-1">Retained instructions</span>
          </div>
          {renderIR(ir, true)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
