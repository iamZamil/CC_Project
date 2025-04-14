import type { IRInstruction } from "@/lib/types"

export function optimizeIR(ir: IRInstruction[]): IRInstruction[] {
  let optimized = [...ir]
  let changed = true

  // Apply optimizations until no more changes
  while (changed) {
    changed = false

    // Apply each optimization pass
    const passes = [
      constantFolding,
      constantPropagation,
      deadCodeElimination,
      strengthReduction,
      commonSubexpressionElimination,
    ]

    for (const pass of passes) {
      const result = pass(optimized)
      if (result.changed) {
        optimized = result.ir
        changed = true
      }
    }
  }

  return optimized
}

// Constant folding
function constantFolding(ir: IRInstruction[]): { ir: IRInstruction[]; changed: boolean } {
  const result = [...ir]
  let changed = false

  for (let i = 0; i < result.length; i++) {
    const instr = result[i]

    // Skip non-arithmetic operations
    if (
      !["ADD", "SUB", "MUL", "DIV", "MOD", "AND", "OR", "EQ", "NEQ", "LT", "GT", "LTE", "GTE"].includes(instr.operation)
    ) {
      continue
    }

    // Check if both operands are constants
    if (instr.arg1 && instr.arg2 && !isNaN(Number(instr.arg1)) && !isNaN(Number(instr.arg2))) {
      const a = Number(instr.arg1)
      const b = Number(instr.arg2)
      let value: number

      // Compute the result
      switch (instr.operation) {
        case "ADD":
          value = a + b
          break
        case "SUB":
          value = a - b
          break
        case "MUL":
          value = a * b
          break
        case "DIV":
          value = a / b
          break
        case "MOD":
          value = a % b
          break
        case "AND":
          value = a && b ? 1 : 0
          break
        case "OR":
          value = a || b ? 1 : 0
          break
        case "EQ":
          value = a === b ? 1 : 0
          break
        case "NEQ":
          value = a !== b ? 1 : 0
          break
        case "LT":
          value = a < b ? 1 : 0
          break
        case "GT":
          value = a > b ? 1 : 0
          break
        case "LTE":
          value = a <= b ? 1 : 0
          break
        case "GTE":
          value = a >= b ? 1 : 0
          break
        default:
          continue
      }

      // Replace with constant assignment
      result[i] = {
        operation: "ASSIGN",
        result: instr.result,
        arg1: String(value),
      }

      changed = true
    }
  }

  return { ir: result, changed }
}

// Constant propagation
function constantPropagation(ir: IRInstruction[]): { ir: IRInstruction[]; changed: boolean } {
  const result = [...ir]
  let changed = false
  const constants: Record<string, string> = {}

  for (let i = 0; i < result.length; i++) {
    const instr = result[i]

    // Track constant assignments
    if (instr.operation === "ASSIGN" && instr.result && instr.arg1 && !isNaN(Number(instr.arg1))) {
      constants[instr.result] = instr.arg1
    }

    // Replace variables with constants
    if (instr.arg1 && constants[instr.arg1] !== undefined) {
      result[i] = { ...instr, arg1: constants[instr.arg1] }
      changed = true
    }

    if (instr.arg2 && constants[instr.arg2] !== undefined) {
      result[i] = { ...instr, arg2: constants[instr.arg2] }
      changed = true
    }

    // If a variable is reassigned, remove it from constants
    if (instr.result && constants[instr.result] !== undefined && instr.operation !== "ASSIGN") {
      delete constants[instr.result]
    }
  }

  return { ir: result, changed }
}

// Dead code elimination
function deadCodeElimination(ir: IRInstruction[]): { ir: IRInstruction[]; changed: boolean } {
  const result: IRInstruction[] = []
  let changed = false

  // Find used variables
  const usedVars = new Set<string>()
  const labels = new Set<string>()

  // First pass: collect all labels and variables used in jumps and returns
  for (const instr of ir) {
    if (instr.operation === "LABEL" && instr.label) {
      labels.add(instr.label)
    }

    if (["JUMP", "JUMPF", "JUMPT"].includes(instr.operation) && instr.arg1) {
      usedVars.add(instr.arg1)
    }

    if (instr.operation === "RETURN" && instr.arg1) {
      usedVars.add(instr.arg1)
    }
  }

  // Second pass: backward analysis to find all used variables
  for (let i = ir.length - 1; i >= 0; i--) {
    const instr = ir[i]

    // Always keep function declarations, labels, jumps, and returns
    if (
      ["FUNCTION", "END_FUNCTION", "LABEL", "JUMP", "JUMPF", "JUMPT", "RETURN", "CALL", "PARAM"].includes(
        instr.operation,
      )
    ) {
      result.unshift(instr)
      continue
    }

    // If the result is used, keep the instruction and mark operands as used
    if (instr.result && usedVars.has(instr.result)) {
      if (instr.arg1) usedVars.add(instr.arg1)
      if (instr.arg2) usedVars.add(instr.arg2)
      result.unshift(instr)
    } else {
      changed = true
    }
  }

  return { ir: result, changed }
}

// Strength reduction
function strengthReduction(ir: IRInstruction[]): { ir: IRInstruction[]; changed: boolean } {
  const result = [...ir]
  let changed = false

  for (let i = 0; i < result.length; i++) {
    const instr = result[i]

    // Replace multiplication by 2 with left shift
    if (instr.operation === "MUL" && instr.arg2 === "2") {
      result[i] = {
        operation: "SHL",
        result: instr.result,
        arg1: instr.arg1,
        arg2: "1",
      }
      changed = true
    }

    // Replace division by 2 with right shift
    if (instr.operation === "DIV" && instr.arg2 === "2") {
      result[i] = {
        operation: "SHR",
        result: instr.result,
        arg1: instr.arg1,
        arg2: "1",
      }
      changed = true
    }

    // Replace multiplication by power of 2 with left shift
    if (instr.operation === "MUL" && instr.arg2 && !isNaN(Number(instr.arg2))) {
      const value = Number(instr.arg2)
      if (value > 0 && (value & (value - 1)) === 0) {
        // Check if power of 2
        const shift = Math.log2(value)
        result[i] = {
          operation: "SHL",
          result: instr.result,
          arg1: instr.arg1,
          arg2: String(shift),
        }
        changed = true
      }
    }

    // Replace division by power of 2 with right shift
    if (instr.operation === "DIV" && instr.arg2 && !isNaN(Number(instr.arg2))) {
      const value = Number(instr.arg2)
      if (value > 0 && (value & (value - 1)) === 0) {
        // Check if power of 2
        const shift = Math.log2(value)
        result[i] = {
          operation: "SHR",
          result: instr.result,
          arg1: instr.arg1,
          arg2: String(shift),
        }
        changed = true
      }
    }

    // Replace multiplication by 0 with assignment of 0
    if (instr.operation === "MUL" && (instr.arg1 === "0" || instr.arg2 === "0")) {
      result[i] = {
        operation: "ASSIGN",
        result: instr.result,
        arg1: "0",
      }
      changed = true
    }

    // Replace multiplication by 1 with assignment
    if (instr.operation === "MUL" && instr.arg2 === "1") {
      result[i] = {
        operation: "ASSIGN",
        result: instr.result,
        arg1: instr.arg1,
      }
      changed = true
    }

    // Replace addition by 0 with assignment
    if (instr.operation === "ADD" && instr.arg2 === "0") {
      result[i] = {
        operation: "ASSIGN",
        result: instr.result,
        arg1: instr.arg1,
      }
      changed = true
    }
  }

  return { ir: result, changed }
}

// Common subexpression elimination
function commonSubexpressionElimination(ir: IRInstruction[]): { ir: IRInstruction[]; changed: boolean } {
  const result: IRInstruction[] = []
  let changed = false

  // Map expressions to their results
  const expressions: Record<string, string> = {}

  // Variables that have been modified
  const modified = new Set<string>()

  for (const instr of ir) {
    // Skip non-arithmetic operations
    if (
      !["ADD", "SUB", "MUL", "DIV", "MOD", "AND", "OR", "EQ", "NEQ", "LT", "GT", "LTE", "GTE"].includes(instr.operation)
    ) {
      // If this instruction modifies a variable, invalidate expressions using it
      if (instr.result) {
        modified.add(instr.result)

        // Invalidate expressions using the modified variable
        Object.keys(expressions).forEach((key) => {
          if (key.includes(instr.result!)) {
            delete expressions[key]
          }
        })
      }

      result.push(instr)
      continue
    }

    // Create a key for this expression
    const key = `${instr.operation}:${instr.arg1}:${instr.arg2}`

    // Check if we've seen this expression before and it's still valid
    if (expressions[key] && !modified.has(expressions[key])) {
      // Replace with assignment from previous result
      result.push({
        operation: "ASSIGN",
        result: instr.result,
        arg1: expressions[key],
      })
      changed = true
    } else {
      // New expression, add to map
      expressions[key] = instr.result!
      result.push(instr)
    }
  }

  return { ir: result, changed }
}
