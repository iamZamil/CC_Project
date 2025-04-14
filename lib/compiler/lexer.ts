import type { Token, CompilerError } from "@/lib/types"

// Token types
const TOKEN_TYPES = {
  KEYWORD: "KEYWORD",
  IDENTIFIER: "IDENTIFIER",
  NUMBER: "NUMBER",
  STRING: "STRING",
  OPERATOR: "OPERATOR",
  PUNCTUATION: "PUNCTUATION",
  COMMENT: "COMMENT",
  WHITESPACE: "WHITESPACE",
}

// Keywords
const KEYWORDS = [
  "function",
  "var",
  "if",
  "else",
  "while",
  "for",
  "return",
  "int",
  "float",
  "bool",
  "string",
  "void",
  "true",
  "false",
  "print",
  "read",
  "switch",
  "case",
  "default",
  "break",
]

// Operators
const OPERATORS = ["+", "-", "*", "/", "%", "=", "==", "!=", "<", ">", "<=", ">=", "&&", "||", "!", "++", "--"]

// Punctuation
const PUNCTUATION = ["(", ")", "{", "}", "[", "]", ";", ",", ":", "."]

export function lexicalAnalysis(code: string) {
  const tokens: Token[] = []
  const errors: CompilerError[] = []

  let line = 1
  let column = 1
  let i = 0

  while (i < code.length) {
    const char = code[i]

    // Handle whitespace
    if (/\s/.test(char)) {
      if (char === "\n") {
        line++
        column = 1
      } else {
        column++
      }
      i++
      continue
    }

    // Handle comments
    if (char === "/" && code[i + 1] === "/") {
      // Single-line comment
      let j = i + 2
      while (j < code.length && code[j] !== "\n") {
        j++
      }
      i = j
      continue
    }

    if (char === "/" && code[i + 1] === "*") {
      // Multi-line comment
      let j = i + 2
      const commentLine = line
      const commentColumn = column + 2

      while (j < code.length && !(code[j] === "*" && code[j + 1] === "/")) {
        if (code[j] === "\n") {
          line++
          column = 1
        } else {
          column++
        }
        j++
      }

      if (j >= code.length) {
        errors.push({
          message: "Unterminated multi-line comment",
          line: commentLine,
          column: commentColumn,
        })
      } else {
        j += 2 // Skip */
      }

      i = j
      continue
    }

    // Handle identifiers and keywords
    if (/[a-zA-Z_]/.test(char)) {
      let j = i
      while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) {
        j++
      }

      const value = code.substring(i, j)
      const type = KEYWORDS.includes(value) ? TOKEN_TYPES.KEYWORD : TOKEN_TYPES.IDENTIFIER

      tokens.push({
        type,
        value,
        line,
        column,
      })

      column += j - i
      i = j
      continue
    }

    // Handle numbers
    if (/[0-9]/.test(char)) {
      let j = i
      let isFloat = false

      while (j < code.length && (/[0-9]/.test(code[j]) || (code[j] === "." && !isFloat))) {
        if (code[j] === ".") {
          isFloat = true
        }
        j++
      }

      tokens.push({
        type: TOKEN_TYPES.NUMBER,
        value: code.substring(i, j),
        line,
        column,
      })

      column += j - i
      i = j
      continue
    }

    // Handle strings
    if (char === '"' || char === "'") {
      const quote = char
      let j = i + 1
      const stringLine = line
      const stringColumn = column

      while (j < code.length && code[j] !== quote) {
        if (code[j] === "\n") {
          line++
          column = 1
        } else {
          column++
        }
        j++
      }

      if (j >= code.length) {
        errors.push({
          message: `Unterminated string literal`,
          line: stringLine,
          column: stringColumn,
        })
        i = j
      } else {
        tokens.push({
          type: TOKEN_TYPES.STRING,
          value: code.substring(i + 1, j),
          line: stringLine,
          column: stringColumn,
        })

        column += j - i + 1
        i = j + 1
      }

      continue
    }

    // Handle operators
    let foundOperator = false
    for (const op of OPERATORS) {
      if (code.substring(i, i + op.length) === op) {
        tokens.push({
          type: TOKEN_TYPES.OPERATOR,
          value: op,
          line,
          column,
        })

        column += op.length
        i += op.length
        foundOperator = true
        break
      }
    }

    if (foundOperator) continue

    // Handle punctuation
    if (PUNCTUATION.includes(char)) {
      tokens.push({
        type: TOKEN_TYPES.PUNCTUATION,
        value: char,
        line,
        column,
      })

      column++
      i++
      continue
    }

    // Handle unknown characters
    errors.push({
      message: `Unexpected character: ${char}`,
      line,
      column,
    })

    column++
    i++
  }

  return { tokens, errors }
}
