import type { ASTNode, SymbolTable, CompilerError } from "@/lib/types"

export function semanticAnalysis(ast: ASTNode) {
  const symbolTable: SymbolTable = {
    global: {},
  }

  const errors: CompilerError[] = []
  let currentScope = "global"

  // Helper functions
  const enterScope = (scope: string) => {
    currentScope = scope
    if (!symbolTable[scope]) {
      symbolTable[scope] = {}
    }
  }

  const exitScope = () => {
    currentScope = "global"
  }

  const declareSymbol = (
    name: string,
    type: string,
    kind: "variable" | "function" | "parameter",
    line: number,
    params?: { name: string; type: string }[],
  ) => {
    if (symbolTable[currentScope][name]) {
      errors.push({
        message: `Redeclaration of '${name}' in the same scope`,
        line,
        column: 0,
      })
      return false
    }

    symbolTable[currentScope][name] = {
      name,
      type,
      kind,
      line,
      params,
    }

    return true
  }

  const findSymbol = (name: string): { scope: string; info: any } | null => {
    if (symbolTable[currentScope][name]) {
      return { scope: currentScope, info: symbolTable[currentScope][name] }
    }

    if (symbolTable.global[name]) {
      return { scope: "global", info: symbolTable.global[name] }
    }

    return null
  }

  // Type checking functions
  const getExpressionType = (node: ASTNode): string => {
    switch (node.type) {
      case "Literal":
        return node.dataType || "unknown"

      case "Variable": {
        const symbol = findSymbol(node.value as string)
        if (!symbol) {
          errors.push({
            message: `Undefined variable '${node.value}'`,
            line: node.line || 0,
            column: node.column || 0,
          })
          return "unknown"
        }
        return symbol.info.type
      }

      case "Call": {
        const funcName = node.value as string
        const symbol = findSymbol(funcName)

        if (!symbol) {
          errors.push({
            message: `Undefined function '${funcName}'`,
            line: node.line || 0,
            column: node.column || 0,
          })
          return "unknown"
        }

        if (symbol.info.kind !== "function") {
          errors.push({
            message: `'${funcName}' is not a function`,
            line: node.line || 0,
            column: node.column || 0,
          })
          return "unknown"
        }

        // Check argument count
        const expectedParams = symbol.info.params || []
        const actualArgs = node.children ? node.children.slice(1) : []

        if (expectedParams.length !== actualArgs.length) {
          errors.push({
            message: `Function '${funcName}' expects ${expectedParams.length} arguments, but got ${actualArgs.length}`,
            line: node.line || 0,
            column: node.column || 0,
          })
        } else {
          // Check argument types
          for (let i = 0; i < expectedParams.length; i++) {
            const expectedType = expectedParams[i].type
            const actualType = getExpressionType(actualArgs[i])

            if (actualType !== "unknown" && expectedType !== actualType) {
              errors.push({
                message: `Type mismatch: Parameter ${i + 1} of '${funcName}' expects ${expectedType}, but got ${actualType}`,
                line: actualArgs[i].line || 0,
                column: actualArgs[i].column || 0,
              })
            }
          }
        }

        return symbol.info.type
      }

      case "Addition":
      case "Subtraction":
      case "Multiplication":
      case "Division":
      case "Modulo": {
        const leftType = getExpressionType(node.children![0])
        const rightType = getExpressionType(node.children![1])

        if (leftType === "unknown" || rightType === "unknown") {
          return "unknown"
        }

        if (leftType === "string" && rightType === "string" && node.type === "Addition") {
          return "string"
        }

        if ((leftType === "int" || leftType === "float") && (rightType === "int" || rightType === "float")) {
          return leftType === "float" || rightType === "float" ? "float" : "int"
        }

        errors.push({
          message: `Invalid operand types for operator '${node.type}': ${leftType} and ${rightType}`,
          line: node.children![0].line || 0,
          column: node.children![0].column || 0,
        })

        return "unknown"
      }

      case "Equal":
      case "NotEqual":
      case "LessThan":
      case "GreaterThan":
      case "LessThanEqual":
      case "GreaterThanEqual": {
        const leftType = getExpressionType(node.children![0])
        const rightType = getExpressionType(node.children![1])

        if (leftType === "unknown" || rightType === "unknown") {
          return "bool"
        }

        if (leftType !== rightType) {
          errors.push({
            message: `Cannot compare values of different types: ${leftType} and ${rightType}`,
            line: node.children![0].line || 0,
            column: node.children![0].column || 0,
          })
        }

        return "bool"
      }

      case "LogicalAnd":
      case "LogicalOr": {
        const leftType = getExpressionType(node.children![0])
        const rightType = getExpressionType(node.children![1])

        if (leftType !== "bool" && leftType !== "unknown") {
          errors.push({
            message: `Left operand of logical operator must be boolean, got ${leftType}`,
            line: node.children![0].line || 0,
            column: node.children![0].column || 0,
          })
        }

        if (rightType !== "bool" && rightType !== "unknown") {
          errors.push({
            message: `Right operand of logical operator must be boolean, got ${rightType}`,
            line: node.children![1].line || 0,
            column: node.children![1].column || 0,
          })
        }

        return "bool"
      }

      case "Not": {
        const exprType = getExpressionType(node.children![0])

        if (exprType !== "bool" && exprType !== "unknown") {
          errors.push({
            message: `Operand of '!' must be boolean, got ${exprType}`,
            line: node.children![0].line || 0,
            column: node.children![0].column || 0,
          })
        }

        return "bool"
      }

      case "Negate": {
        const exprType = getExpressionType(node.children![0])

        if (exprType !== "int" && exprType !== "float" && exprType !== "unknown") {
          errors.push({
            message: `Operand of unary '-' must be numeric, got ${exprType}`,
            line: node.children![0].line || 0,
            column: node.children![0].column || 0,
          })
        }

        return exprType
      }

      case "Assignment": {
        const leftNode = node.children![0]
        const rightNode = node.children![1]

        if (leftNode.type !== "Variable") {
          errors.push({
            message: "Left side of assignment must be a variable",
            line: leftNode.line || 0,
            column: leftNode.column || 0,
          })
          return "unknown"
        }

        const leftType = getExpressionType(leftNode)
        const rightType = getExpressionType(rightNode)

        if (leftType !== "unknown" && rightType !== "unknown" && leftType !== rightType) {
          errors.push({
            message: `Cannot assign value of type '${rightType}' to variable of type '${leftType}'`,
            line: node.children![0].line || 0,
            column: node.children![0].column || 0,
          })
        }

        return leftType
      }

      default:
        return "unknown"
    }
  }

  // Visitor pattern for AST traversal
  const visitNode = (node: ASTNode) => {
    switch (node.type) {
      case "Program":
        node.children?.forEach(visitNode)
        break

      case "FunctionDeclaration": {
        const funcName = node.value as string
        const returnType = node.dataType || "void"

        // Extract parameters
        const paramsNode = node.children![0]
        const params =
          paramsNode.children?.map((param) => ({
            name: param.value as string,
            type: param.dataType as string,
          })) || []

        // Declare function in symbol table
        declareSymbol(funcName, returnType, "function", node.line || 0, params)

        // Enter function scope
        enterScope(funcName)

        // Declare parameters in function scope
        paramsNode.children?.forEach((param) => {
          declareSymbol(param.value as string, param.dataType as string, "parameter", param.line || 0)
        })

        // Visit function body
        visitNode(node.children![1])

        // Check return statements
        checkReturnStatements(node.children![1], returnType)

        // Exit function scope
        exitScope()
        break
      }

      case "VariableDeclaration": {
        const varName = node.value as string
        const varType = node.dataType as string

        if (!varType) {
          errors.push({
            message: `Variable '${varName}' declared without a type`,
            line: node.line || 0,
            column: node.column || 0,
          })
          break
        }

        // Declare variable in symbol table
        declareSymbol(varName, varType, "variable", node.line || 0)

        // Check initialization if present
        if (node.children && node.children.length > 0) {
          const initExpr = node.children[0]
          const initType = getExpressionType(initExpr)

          if (initType !== "unknown" && initType !== varType) {
            errors.push({
              message: `Cannot initialize variable of type '${varType}' with value of type '${initType}'`,
              line: node.line || 0,
              column: node.column || 0,
            })
          }
        }
        break
      }

      case "Block":
        node.children?.forEach(visitNode)
        break

      case "IfStatement": {
        // Check condition type
        const conditionType = getExpressionType(node.children![0])
        if (conditionType !== "bool" && conditionType !== "unknown") {
          errors.push({
            message: `Condition must be of type 'bool', got '${conditionType}'`,
            line: node.children![0].line || 0,
            column: node.children![0].column || 0,
          })
        }

        // Visit then branch
        visitNode(node.children![1])

        // Visit else branch if present
        if (node.children!.length > 2) {
          visitNode(node.children![2])
        }
        break
      }

      case "WhileStatement": {
        // Check condition type
        const conditionType = getExpressionType(node.children![0])
        if (conditionType !== "bool" && conditionType !== "unknown") {
          errors.push({
            message: `Condition must be of type 'bool', got '${conditionType}'`,
            line: node.children![0].line || 0,
            column: node.children![0].column || 0,
          })
        }

        // Visit body
        visitNode(node.children![1])
        break
      }

      case "ForStatement": {
        // Visit initialization
        if (node.children![0].type !== "Empty") {
          visitNode(node.children![0])
        }

        // Check condition type
        if (node.children![1].type !== "Empty") {
          const conditionType = getExpressionType(node.children![1])
          if (conditionType !== "bool" && conditionType !== "unknown") {
            errors.push({
              message: `Condition must be of type 'bool', got '${conditionType}'`,
              line: node.children![1].line || 0,
              column: node.children![1].column || 0,
            })
          }
        }

        // Visit increment
        if (node.children![2].type !== "Empty") {
          getExpressionType(node.children![2])
        }

        // Visit body
        visitNode(node.children![3])
        break
      }

      case "ReturnStatement": {
        // Check return value type if present
        if (node.children && node.children.length > 0) {
          getExpressionType(node.children[0])
        }
        break
      }

      case "ExpressionStatement":
        getExpressionType(node.children![0])
        break

      default:
        // For other node types, just visit children
        node.children?.forEach((child) => {
          if (child) visitNode(child)
        })
    }
  }

  const checkReturnStatements = (node: ASTNode, expectedType: string) => {
    if (node.type === "ReturnStatement") {
      if (expectedType === "void") {
        if (node.children && node.children.length > 0) {
          errors.push({
            message: "Void function should not return a value",
            line: node.line || 0,
            column: node.column || 0,
          })
        }
      } else {
        if (!node.children || node.children.length === 0) {
          errors.push({
            message: `Function with return type '${expectedType}' must return a value`,
            line: node.line || 0,
            column: node.column || 0,
          })
        } else {
          const returnType = getExpressionType(node.children[0])
          if (returnType !== "unknown" && returnType !== expectedType) {
            errors.push({
              message: `Cannot return value of type '${returnType}' from function with return type '${expectedType}'`,
              line: node.children[0].line || 0,
              column: node.children[0].column || 0,
            })
          }
        }
      }
    } else if (node.type === "Block") {
      let hasReturn = false

      for (const child of node.children || []) {
        if (checkReturnStatements(child, expectedType)) {
          hasReturn = true
        }
      }

      return hasReturn
    } else if (node.type === "IfStatement") {
      const thenHasReturn = checkReturnStatements(node.children![1], expectedType)
      let elseHasReturn = false

      if (node.children!.length > 2) {
        elseHasReturn = checkReturnStatements(node.children![2], expectedType)
      }

      return thenHasReturn && elseHasReturn
    }

    return false
  }

  // Start analysis
  visitNode(ast)

  return { symbolTable, errors }
}
