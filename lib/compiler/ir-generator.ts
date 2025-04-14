import type { ASTNode, SymbolTable, IRInstruction } from "@/lib/types"

export function generateIR(ast: ASTNode, symbolTable: SymbolTable) {
  const ir: IRInstruction[] = []
  let tempCounter = 0
  let labelCounter = 0

  // Helper functions
  const generateTemp = () => `t${tempCounter++}`
  const generateLabel = () => `L${labelCounter++}`

  // Generate IR for expressions
  const generateExpressionIR = (node: ASTNode): string => {
    switch (node.type) {
      case "Literal": {
        const temp = generateTemp()
        ir.push({
          operation: "ASSIGN",
          result: temp,
          arg1: String(node.value),
        })
        return temp
      }

      case "Variable": {
        return node.value as string
      }

      case "Addition": {
        const left = generateExpressionIR(node.children![0])
        const right = generateExpressionIR(node.children![1])
        const temp = generateTemp()

        ir.push({
          operation: "ADD",
          result: temp,
          arg1: left,
          arg2: right,
        })

        return temp
      }

      case "Subtraction": {
        const left = generateExpressionIR(node.children![0])
        const right = generateExpressionIR(node.children![1])
        const temp = generateTemp()

        ir.push({
          operation: "SUB",
          result: temp,
          arg1: left,
          arg2: right,
        })

        return temp
      }

      case "Multiplication": {
        const left = generateExpressionIR(node.children![0])
        const right = generateExpressionIR(node.children![1])
        const temp = generateTemp()

        ir.push({
          operation: "MUL",
          result: temp,
          arg1: left,
          arg2: right,
        })

        return temp
      }

      case "Division": {
        const left = generateExpressionIR(node.children![0])
        const right = generateExpressionIR(node.children![1])
        const temp = generateTemp()

        ir.push({
          operation: "DIV",
          result: temp,
          arg1: left,
          arg2: right,
        })

        return temp
      }

      case "Modulo": {
        const left = generateExpressionIR(node.children![0])
        const right = generateExpressionIR(node.children![1])
        const temp = generateTemp()

        ir.push({
          operation: "MOD",
          result: temp,
          arg1: left,
          arg2: right,
        })

        return temp
      }

      case "Equal": {
        const left = generateExpressionIR(node.children![0])
        const right = generateExpressionIR(node.children![1])
        const temp = generateTemp()

        ir.push({
          operation: "EQ",
          result: temp,
          arg1: left,
          arg2: right,
        })

        return temp
      }

      case "NotEqual": {
        const left = generateExpressionIR(node.children![0])
        const right = generateExpressionIR(node.children![1])
        const temp = generateTemp()

        ir.push({
          operation: "NEQ",
          result: temp,
          arg1: left,
          arg2: right,
        })

        return temp
      }

      case "LessThan": {
        const left = generateExpressionIR(node.children![0])
        const right = generateExpressionIR(node.children![1])
        const temp = generateTemp()

        ir.push({
          operation: "LT",
          result: temp,
          arg1: left,
          arg2: right,
        })

        return temp
      }

      case "GreaterThan": {
        const left = generateExpressionIR(node.children![0])
        const right = generateExpressionIR(node.children![1])
        const temp = generateTemp()

        ir.push({
          operation: "GT",
          result: temp,
          arg1: left,
          arg2: right,
        })

        return temp
      }

      case "LessThanEqual": {
        const left = generateExpressionIR(node.children![0])
        const right = generateExpressionIR(node.children![1])
        const temp = generateTemp()

        ir.push({
          operation: "LTE",
          result: temp,
          arg1: left,
          arg2: right,
        })

        return temp
      }

      case "GreaterThanEqual": {
        const left = generateExpressionIR(node.children![0])
        const right = generateExpressionIR(node.children![1])
        const temp = generateTemp()

        ir.push({
          operation: "GTE",
          result: temp,
          arg1: left,
          arg2: right,
        })

        return temp
      }

      case "LogicalAnd": {
        const left = generateExpressionIR(node.children![0])
        const right = generateExpressionIR(node.children![1])
        const temp = generateTemp()

        ir.push({
          operation: "AND",
          result: temp,
          arg1: left,
          arg2: right,
        })

        return temp
      }

      case "LogicalOr": {
        const left = generateExpressionIR(node.children![0])
        const right = generateExpressionIR(node.children![1])
        const temp = generateTemp()

        ir.push({
          operation: "OR",
          result: temp,
          arg1: left,
          arg2: right,
        })

        return temp
      }

      case "Not": {
        const expr = generateExpressionIR(node.children![0])
        const temp = generateTemp()

        ir.push({
          operation: "NOT",
          result: temp,
          arg1: expr,
        })

        return temp
      }

      case "Negate": {
        const expr = generateExpressionIR(node.children![0])
        const temp = generateTemp()

        ir.push({
          operation: "NEG",
          result: temp,
          arg1: expr,
        })

        return temp
      }

      case "Assignment": {
        const left = node.children![0].value as string
        const right = generateExpressionIR(node.children![1])

        ir.push({
          operation: "ASSIGN",
          result: left,
          arg1: right,
        })

        return left
      }

      case "Call": {
        const funcName = node.value as string
        const args: string[] = []

        // Process arguments
        for (let i = 1; i < node.children!.length; i++) {
          const argTemp = generateExpressionIR(node.children![i])
          args.push(argTemp)
        }

        // Push argument instructions
        for (let i = 0; i < args.length; i++) {
          ir.push({
            operation: "PARAM",
            arg1: args[i],
            arg2: String(i + 1),
          })
        }

        // Call function
        const temp = generateTemp()
        ir.push({
          operation: "CALL",
          result: temp,
          arg1: funcName,
          arg2: String(args.length),
        })

        return temp
      }

      default:
        console.warn(`Unhandled expression type: ${node.type}`)
        return generateTemp()
    }
  }

  // Generate IR for statements
  const generateStatementIR = (node: ASTNode) => {
    switch (node.type) {
      case "Program":
        node.children?.forEach(generateStatementIR)
        break

      case "FunctionDeclaration": {
        const funcName = node.value as string

        // Function entry
        ir.push({
          operation: "FUNCTION",
          result: funcName,
          label: funcName,
        })

        // Generate IR for function body
        generateStatementIR(node.children![1])

        // Function exit
        ir.push({
          operation: "END_FUNCTION",
          result: funcName,
        })

        break
      }

      case "VariableDeclaration": {
        const varName = node.value as string

        // If there's an initializer, generate IR for it
        if (node.children && node.children.length > 0) {
          const initValue = generateExpressionIR(node.children[0])

          ir.push({
            operation: "ASSIGN",
            result: varName,
            arg1: initValue,
          })
        }

        break
      }

      case "Block":
        node.children?.forEach(generateStatementIR)
        break

      case "IfStatement": {
        const condition = generateExpressionIR(node.children![0])
        const elseLabel = generateLabel()
        const endLabel = generateLabel()

        // Jump to else if condition is false
        ir.push({
          operation: "JUMPF",
          arg1: condition,
          arg2: elseLabel,
        })

        // Generate IR for then branch
        generateStatementIR(node.children![1])

        // Jump to end after then branch
        ir.push({
          operation: "JUMP",
          arg1: endLabel,
        })

        // Else branch
        ir.push({
          operation: "LABEL",
          label: elseLabel,
        })

        // Generate IR for else branch if present
        if (node.children!.length > 2) {
          generateStatementIR(node.children![2])
        }

        // End of if statement
        ir.push({
          operation: "LABEL",
          label: endLabel,
        })

        break
      }

      case "WhileStatement": {
        const startLabel = generateLabel()
        const endLabel = generateLabel()

        // Start of loop
        ir.push({
          operation: "LABEL",
          label: startLabel,
        })

        // Evaluate condition
        const condition = generateExpressionIR(node.children![0])

        // Jump to end if condition is false
        ir.push({
          operation: "JUMPF",
          arg1: condition,
          arg2: endLabel,
        })

        // Generate IR for loop body
        generateStatementIR(node.children![1])

        // Jump back to start
        ir.push({
          operation: "JUMP",
          arg1: startLabel,
        })

        // End of loop
        ir.push({
          operation: "LABEL",
          label: endLabel,
        })

        break
      }

      case "ForStatement": {
        // Generate IR for initialization
        if (node.children![0].type !== "Empty") {
          generateStatementIR(node.children![0])
        }

        const startLabel = generateLabel()
        const updateLabel = generateLabel()
        const endLabel = generateLabel()

        // Start of loop
        ir.push({
          operation: "LABEL",
          label: startLabel,
        })

        // Evaluate condition if present
        if (node.children![1].type !== "Empty") {
          const condition = generateExpressionIR(node.children![1])

          // Jump to end if condition is false
          ir.push({
            operation: "JUMPF",
            arg1: condition,
            arg2: endLabel,
          })
        }

        // Generate IR for loop body
        generateStatementIR(node.children![3])

        // Update label
        ir.push({
          operation: "LABEL",
          label: updateLabel,
        })

        // Generate IR for update expression
        if (node.children![2].type !== "Empty") {
          generateExpressionIR(node.children![2])
        }

        // Jump back to start
        ir.push({
          operation: "JUMP",
          arg1: startLabel,
        })

        // End of loop
        ir.push({
          operation: "LABEL",
          label: endLabel,
        })

        break
      }

      case "ReturnStatement": {
        // If there's a return value, generate IR for it
        if (node.children && node.children.length > 0) {
          const returnValue = generateExpressionIR(node.children[0])

          ir.push({
            operation: "RETURN",
            arg1: returnValue,
          })
        } else {
          ir.push({
            operation: "RETURN",
          })
        }

        break
      }

      case "ExpressionStatement":
        generateExpressionIR(node.children![0])
        break

      default:
        console.warn(`Unhandled statement type: ${node.type}`)
    }
  }

  // Start IR generation
  generateStatementIR(ast)

  return { ir }
}
