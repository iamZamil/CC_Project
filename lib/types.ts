// Token types
export interface Token {
  type: string
  value: string
  line: number
  column: number
}

// AST node types
export interface ASTNode {
  type: string
  value?: string | number | boolean
  dataType?: string
  children?: ASTNode[]
  line?: number
  column?: number
}

// Symbol table types
export interface SymbolInfo {
  name: string
  type: string
  kind: "variable" | "function" | "parameter"
  line: number
  params?: { name: string; type: string }[]
}

export interface SymbolTable {
  [scope: string]: {
    [name: string]: SymbolInfo
  }
}

// IR types
export interface IRInstruction {
  operation: string
  result?: string
  arg1?: string
  arg2?: string
  label?: string
}

// Error types
export interface CompilerError {
  message: string
  line: number
  column: number
}

// Compilation result
export interface CompilationResult {
  phase: "lexer" | "parser" | "semantic" | "ir" | "complete" | "error"
  result: {
    tokens?: Token[]
    ast?: ASTNode
    symbolTable?: SymbolTable
    ir?: IRInstruction[]
    optimizedIR?: IRInstruction[]
  }
  errors: CompilerError[]
}
