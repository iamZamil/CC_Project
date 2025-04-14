import type { Token, ASTNode, CompilerError } from "@/lib/types"

export function syntaxAnalysis(tokens: Token[]) {
  let currentTokenIndex = 0
  const errors: CompilerError[] = []

  // Helper functions
  const peek = () => tokens[currentTokenIndex] || null
  const consume = () => tokens[currentTokenIndex++]
  const match = (type: string, value?: string) => {
    const token = peek()
    if (!token) return false
    if (token.type !== type) return false
    if (value !== undefined && token.value !== value) return false
    consume()
    return true
  }

  const expectToken = (type: string, value?: string) => {
    const token = peek()
    if (!token) {
      errors.push({
        message: `Expected ${type}${value ? ` '${value}'` : ""}, but reached end of file`,
        line: tokens[tokens.length - 1]?.line || 0,
        column: tokens[tokens.length - 1]?.column || 0,
      })
      return null
    }

    if (token.type !== type || (value !== undefined && token.value !== value)) {
      errors.push({
        message: `Expected ${type}${value ? ` '${value}'` : ""}, but got ${token.type} '${token.value}'`,
        line: token.line,
        column: token.column,
      })
      return null
    }

    return consume()
  }

  // Parsing functions
  const parseProgram = (): ASTNode => {
    const program: ASTNode = {
      type: "Program",
      children: [],
    }

    while (currentTokenIndex < tokens.length) {
      const declaration = parseDeclaration()
      if (declaration) {
        program.children!.push(declaration)
      }
    }

    return program
  }

  const parseDeclaration = (): ASTNode | null => {
    if (match("KEYWORD", "function")) {
      return parseFunctionDeclaration()
    } else if (match("KEYWORD", "var")) {
      return parseVariableDeclaration()
    } else {
      errors.push({
        message: "Expected declaration",
        line: peek()?.line || 0,
        column: peek()?.column || 0,
      })
      // Skip to next semicolon or closing brace
      while (peek() && !match("PUNCTUATION", ";") && !match("PUNCTUATION", "}")) {
        consume()
      }
      return null
    }
  }

  const parseFunctionDeclaration = (): ASTNode | null => {
    const functionNode: ASTNode = {
      type: "FunctionDeclaration",
      children: [],
    }

    const nameToken = expectToken("IDENTIFIER")
    if (!nameToken) return null

    functionNode.value = nameToken.value
    functionNode.line = nameToken.line
    functionNode.column = nameToken.column

    if (!expectToken("PUNCTUATION", "(")) return null

    // Parse parameters
    const paramsNode: ASTNode = {
      type: "Parameters",
      children: [],
    }

    if (!match("PUNCTUATION", ")")) {
      do {
        const paramNode = parseParameter()
        if (paramNode) {
          paramsNode.children!.push(paramNode)
        }
      } while (match("PUNCTUATION", ","))

      if (!expectToken("PUNCTUATION", ")")) return null
    }

    functionNode.children!.push(paramsNode)

    // Parse return type
    if (match("PUNCTUATION", ":")) {
      const typeToken = expectToken("KEYWORD")
      if (!typeToken) return null

      functionNode.dataType = typeToken.value
    }

    // Parse function body
    const bodyNode = parseBlock()
    if (bodyNode) {
      functionNode.children!.push(bodyNode)
    }

    return functionNode
  }

  const parseParameter = (): ASTNode | null => {
    const nameToken = expectToken("IDENTIFIER")
    if (!nameToken) return null

    if (!expectToken("PUNCTUATION", ":")) return null

    const typeToken = expectToken("KEYWORD")
    if (!typeToken) return null

    return {
      type: "Parameter",
      value: nameToken.value,
      dataType: typeToken.value,
      line: nameToken.line,
      column: nameToken.column,
    }
  }

  const parseVariableDeclaration = (): ASTNode | null => {
    const varNode: ASTNode = {
      type: "VariableDeclaration",
      children: [],
    }

    const nameToken = expectToken("IDENTIFIER")
    if (!nameToken) return null

    varNode.value = nameToken.value
    varNode.line = nameToken.line
    varNode.column = nameToken.column

    if (match("PUNCTUATION", ":")) {
      const typeToken = expectToken("KEYWORD")
      if (!typeToken) return null

      varNode.dataType = typeToken.value
    }

    if (match("OPERATOR", "=")) {
      const initNode = parseExpression()
      if (initNode) {
        varNode.children!.push(initNode)
      }
    }

    if (!expectToken("PUNCTUATION", ";")) return null

    return varNode
  }

  const parseBlock = (): ASTNode | null => {
    if (!expectToken("PUNCTUATION", "{")) return null

    const blockNode: ASTNode = {
      type: "Block",
      children: [],
    }

    while (!match("PUNCTUATION", "}")) {
      if (!peek()) {
        errors.push({
          message: "Unexpected end of file, expected }",
          line: tokens[tokens.length - 1]?.line || 0,
          column: tokens[tokens.length - 1]?.column || 0,
        })
        return blockNode
      }

      const statement = parseStatement()
      if (statement) {
        blockNode.children!.push(statement)
      }
    }

    return blockNode
  }

  const parseStatement = (): ASTNode | null => {
    if (match("KEYWORD", "if")) {
      return parseIfStatement()
    } else if (match("KEYWORD", "while")) {
      return parseWhileStatement()
    } else if (match("KEYWORD", "for")) {
      return parseForStatement()
    } else if (match("KEYWORD", "return")) {
      return parseReturnStatement()
    } else if (match("KEYWORD", "var")) {
      return parseVariableDeclaration()
    } else if (match("PUNCTUATION", "{")) {
      currentTokenIndex--
      return parseBlock()
    } else {
      return parseExpressionStatement()
    }
  }

  const parseIfStatement = (): ASTNode | null => {
    const ifNode: ASTNode = {
      type: "IfStatement",
      children: [],
    }

    if (!expectToken("PUNCTUATION", "(")) return null

    const condition = parseExpression()
    if (condition) {
      ifNode.children!.push(condition)
    }

    if (!expectToken("PUNCTUATION", ")")) return null

    const thenBranch = parseStatement()
    if (thenBranch) {
      ifNode.children!.push(thenBranch)
    }

    if (match("KEYWORD", "else")) {
      const elseBranch = parseStatement()
      if (elseBranch) {
        ifNode.children!.push(elseBranch)
      }
    }

    return ifNode
  }

  const parseWhileStatement = (): ASTNode | null => {
    const whileNode: ASTNode = {
      type: "WhileStatement",
      children: [],
    }

    if (!expectToken("PUNCTUATION", "(")) return null

    const condition = parseExpression()
    if (condition) {
      whileNode.children!.push(condition)
    }

    if (!expectToken("PUNCTUATION", ")")) return null

    const body = parseStatement()
    if (body) {
      whileNode.children!.push(body)
    }

    return whileNode
  }

  const parseForStatement = (): ASTNode | null => {
    const forNode: ASTNode = {
      type: "ForStatement",
      children: [],
    }

    if (!expectToken("PUNCTUATION", "(")) return null

    // Initialization
    if (!match("PUNCTUATION", ";")) {
      if (match("KEYWORD", "var")) {
        const init = parseVariableDeclaration()
        if (init) {
          forNode.children!.push(init)
        }
      } else {
        const init = parseExpressionStatement()
        if (init) {
          forNode.children!.push(init)
        }
      }
    } else {
      forNode.children!.push({ type: "Empty" })
    }

    // Condition
    if (!match("PUNCTUATION", ";")) {
      const condition = parseExpression()
      if (condition) {
        forNode.children!.push(condition)
      }
      if (!expectToken("PUNCTUATION", ";")) return null
    } else {
      forNode.children!.push({ type: "Empty" })
    }

    // Increment
    if (!match("PUNCTUATION", ")")) {
      const increment = parseExpression()
      if (increment) {
        forNode.children!.push(increment)
      }
      if (!expectToken("PUNCTUATION", ")")) return null
    } else {
      forNode.children!.push({ type: "Empty" })
    }

    // Body
    const body = parseStatement()
    if (body) {
      forNode.children!.push(body)
    }

    return forNode
  }

  const parseReturnStatement = (): ASTNode | null => {
    const returnNode: ASTNode = {
      type: "ReturnStatement",
      children: [],
    }

    if (!match("PUNCTUATION", ";")) {
      const value = parseExpression()
      if (value) {
        returnNode.children!.push(value)
      }
      if (!expectToken("PUNCTUATION", ";")) return null
    }

    return returnNode
  }

  const parseExpressionStatement = (): ASTNode | null => {
    const expr = parseExpression()
    if (!expr) return null

    if (!expectToken("PUNCTUATION", ";")) return null

    return {
      type: "ExpressionStatement",
      children: [expr],
    }
  }

  const parseExpression = (): ASTNode | null => {
    return parseAssignment()
  }

  const parseAssignment = (): ASTNode | null => {
    const left = parseLogicalOr()
    if (!left) return null

    if (match("OPERATOR", "=")) {
      const right = parseAssignment()
      if (!right) return null

      return {
        type: "Assignment",
        children: [left, right],
      }
    }

    return left
  }

  const parseLogicalOr = (): ASTNode | null => {
    let expr = parseLogicalAnd()
    if (!expr) return null

    while (match("OPERATOR", "||")) {
      const right = parseLogicalAnd()
      if (!right) return null

      expr = {
        type: "LogicalOr",
        children: [expr, right],
      }
    }

    return expr
  }

  const parseLogicalAnd = (): ASTNode | null => {
    let expr = parseEquality()
    if (!expr) return null

    while (match("OPERATOR", "&&")) {
      const right = parseEquality()
      if (!right) return null

      expr = {
        type: "LogicalAnd",
        children: [expr, right],
      }
    }

    return expr
  }

  const parseEquality = (): ASTNode | null => {
    let expr = parseComparison()
    if (!expr) return null

    while (match("OPERATOR", "==") || match("OPERATOR", "!=")) {
      const operator = tokens[currentTokenIndex - 1].value
      const right = parseComparison()
      if (!right) return null

      expr = {
        type: operator === "==" ? "Equal" : "NotEqual",
        children: [expr, right],
      }
    }

    return expr
  }

  const parseComparison = (): ASTNode | null => {
    let expr = parseTerm()
    if (!expr) return null

    while (match("OPERATOR", "<") || match("OPERATOR", ">") || match("OPERATOR", "<=") || match("OPERATOR", ">=")) {
      const operator = tokens[currentTokenIndex - 1].value
      const right = parseTerm()
      if (!right) return null

      let type
      switch (operator) {
        case "<":
          type = "LessThan"
          break
        case ">":
          type = "GreaterThan"
          break
        case "<=":
          type = "LessThanEqual"
          break
        case ">=":
          type = "GreaterThanEqual"
          break
      }

      expr = {
        type,
        children: [expr, right],
      }
    }

    return expr
  }

  const parseTerm = (): ASTNode | null => {
    let expr = parseFactor()
    if (!expr) return null

    while (match("OPERATOR", "+") || match("OPERATOR", "-")) {
      const operator = tokens[currentTokenIndex - 1].value
      const right = parseFactor()
      if (!right) return null

      expr = {
        type: operator === "+" ? "Addition" : "Subtraction",
        children: [expr, right],
      }
    }

    return expr
  }

  const parseFactor = (): ASTNode | null => {
    let expr = parseUnary()
    if (!expr) return null

    while (match("OPERATOR", "*") || match("OPERATOR", "/") || match("OPERATOR", "%")) {
      const operator = tokens[currentTokenIndex - 1].value
      const right = parseUnary()
      if (!right) return null

      let type
      switch (operator) {
        case "*":
          type = "Multiplication"
          break
        case "/":
          type = "Division"
          break
        case "%":
          type = "Modulo"
          break
      }

      expr = {
        type,
        children: [expr, right],
      }
    }

    return expr
  }

  const parseUnary = (): ASTNode | null => {
    if (match("OPERATOR", "!") || match("OPERATOR", "-")) {
      const operator = tokens[currentTokenIndex - 1].value
      const right = parseUnary()
      if (!right) return null

      return {
        type: operator === "!" ? "Not" : "Negate",
        children: [right],
      }
    }

    return parseCall()
  }

  const parseCall = (): ASTNode | null => {
    let expr = parsePrimary()
    if (!expr) return null

    while (true) {
      if (match("PUNCTUATION", "(")) {
        expr = finishCall(expr)
      } else {
        break
      }
    }

    return expr
  }

  const finishCall = (callee: ASTNode): ASTNode => {
    const args: ASTNode[] = []

    if (!match("PUNCTUATION", ")")) {
      do {
        const arg = parseExpression()
        if (arg) args.push(arg)
      } while (match("PUNCTUATION", ","))

      expectToken("PUNCTUATION", ")")
    }

    return {
      type: "Call",
      value: callee.value,
      children: [callee, ...args],
    }
  }

  const parsePrimary = (): ASTNode | null => {
    if (match("KEYWORD", "true")) {
      return { type: "Literal", value: true, dataType: "bool" }
    }

    if (match("KEYWORD", "false")) {
      return { type: "Literal", value: false, dataType: "bool" }
    }

    if (match("NUMBER")) {
      const token = tokens[currentTokenIndex - 1]
      const value = token.value
      const isFloat = value.includes(".")

      return {
        type: "Literal",
        value: isFloat ? Number.parseFloat(value) : Number.parseInt(value),
        dataType: isFloat ? "float" : "int",
        line: token.line,
        column: token.column,
      }
    }

    if (match("STRING")) {
      const token = tokens[currentTokenIndex - 1]
      return {
        type: "Literal",
        value: token.value,
        dataType: "string",
        line: token.line,
        column: token.column,
      }
    }

    if (match("IDENTIFIER")) {
      const token = tokens[currentTokenIndex - 1]
      return {
        type: "Variable",
        value: token.value,
        line: token.line,
        column: token.column,
      }
    }

    if (match("PUNCTUATION", "(")) {
      const expr = parseExpression()
      expectToken("PUNCTUATION", ")")
      return expr
    }

    errors.push({
      message: "Expected expression",
      line: peek()?.line || 0,
      column: peek()?.column || 0,
    })

    // Skip to next semicolon or closing brace
    while (peek() && !match("PUNCTUATION", ";") && !match("PUNCTUATION", "}")) {
      consume()
    }

    return null
  }

  // Start parsing
  const ast = parseProgram()

  return { ast, errors }
}
