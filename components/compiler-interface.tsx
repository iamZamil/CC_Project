"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import CodeEditor from "@/components/code-editor"
import TokenDisplay from "@/components/token-display"
import AstVisualizer from "@/components/ast-visualizer"
import SymbolTable from "@/components/symbol-table"
import IRDisplay from "@/components/ir-display"
import ErrorDisplay from "@/components/error-display"
import { lexicalAnalysis } from "@/lib/compiler/lexer"
import { syntaxAnalysis } from "@/lib/compiler/parser"
import { semanticAnalysis } from "@/lib/compiler/semantic-analyzer"
import { generateIR } from "@/lib/compiler/ir-generator"
import { optimizeIR } from "@/lib/compiler/optimizer"
import type { CompilationResult } from "@/lib/types"

const DEFAULT_CODE = `// Sample program
function factorial(n: int): int {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

function main(): int {
  var result: int = factorial(5);
  print(result);
  return 0;
}
`

export default function CompilerInterface() {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null)
  const [activePhase, setActivePhase] = useState("lexer")
  const [isCompiling, setIsCompiling] = useState(false)

  const handleCompile = async () => {
    setIsCompiling(true)
    try {
      // Lexical Analysis
      const lexResult = lexicalAnalysis(code)
      if (lexResult.errors.length > 0) {
        setCompilationResult({ phase: "lexer", result: lexResult, errors: lexResult.errors })
        setActivePhase("lexer")
        return
      }

      // Syntax Analysis
      const parseResult = syntaxAnalysis(lexResult.tokens)
      if (parseResult.errors.length > 0) {
        setCompilationResult({
          phase: "parser",
          result: { ...parseResult, tokens: lexResult.tokens },
          errors: parseResult.errors,
        })
        setActivePhase("parser")
        return
      }

      // Semantic Analysis
      const semanticResult = semanticAnalysis(parseResult.ast)
      if (semanticResult.errors.length > 0) {
        setCompilationResult({
          phase: "semantic",
          result: {
            ...semanticResult,
            tokens: lexResult.tokens,
            ast: parseResult.ast,
          },
          errors: semanticResult.errors,
        })
        setActivePhase("semantic")
        return
      }

      // IR Generation
      const irResult = generateIR(parseResult.ast, semanticResult.symbolTable)

      // IR Optimization
      const optimizedIR = optimizeIR(irResult.ir)

      // Set the final result
      setCompilationResult({
        phase: "complete",
        result: {
          tokens: lexResult.tokens,
          ast: parseResult.ast,
          symbolTable: semanticResult.symbolTable,
          ir: irResult.ir,
          optimizedIR: optimizedIR,
        },
        errors: [],
      })

      setActivePhase("ir")
    } catch (error) {
      console.error("Compilation error:", error)
      setCompilationResult({
        phase: "error",
        result: {},
        errors: [
          {
            message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
            line: 0,
            column: 0,
          },
        ],
      })
    } finally {
      setIsCompiling(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="flex flex-col h-full">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Source Code</h2>
          <Button onClick={handleCompile} disabled={isCompiling}>
            {isCompiling ? "Compiling..." : "Compile"}
          </Button>
        </div>
        <div className="flex-1 border rounded-md overflow-hidden">
          <CodeEditor code={code} onChange={setCode} />
        </div>
      </div>

      <div className="flex flex-col h-full">
        <h2 className="text-xl font-semibold mb-4">Compilation Results</h2>

        {compilationResult?.errors.length > 0 && (
          <div className="mb-4">
            <ErrorDisplay errors={compilationResult.errors} />
          </div>
        )}

        <Tabs value={activePhase} onValueChange={setActivePhase} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="lexer">Lexical</TabsTrigger>
            <TabsTrigger value="parser">Syntax</TabsTrigger>
            <TabsTrigger value="semantic">Semantic</TabsTrigger>
            <TabsTrigger value="ir">IR & Optimization</TabsTrigger>
          </TabsList>

          <div className="flex-1 border rounded-md mt-2 p-4 overflow-auto">
            <TabsContent value="lexer" className="h-full">
              {compilationResult?.result.tokens ? (
                <TokenDisplay tokens={compilationResult.result.tokens} />
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  Compile your code to see lexical analysis results
                </div>
              )}
            </TabsContent>

            <TabsContent value="parser" className="h-full">
              {compilationResult?.result.ast ? (
                <AstVisualizer ast={compilationResult.result.ast} />
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  Compile your code to see syntax analysis results
                </div>
              )}
            </TabsContent>

            <TabsContent value="semantic" className="h-full">
              {compilationResult?.result.symbolTable ? (
                <SymbolTable symbolTable={compilationResult.result.symbolTable} />
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  Compile your code to see semantic analysis results
                </div>
              )}
            </TabsContent>

            <TabsContent value="ir" className="h-full">
              {compilationResult?.result.ir ? (
                <IRDisplay
                  ir={compilationResult.result.ir}
                  optimizedIR={compilationResult.result.optimizedIR || compilationResult.result.ir}
                />
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  Compile your code to see IR and optimization results
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
