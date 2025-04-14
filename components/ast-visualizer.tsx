"use client"

import { useEffect, useRef, useState } from "react"
import { Tree } from "react-d3-tree"
import type { ASTNode } from "@/lib/types"

interface AstVisualizerProps {
  ast: ASTNode
}

// Convert AST to format required by react-d3-tree
const convertAstToTreeData = (ast: ASTNode): any => {
  const children = ast.children?.map(convertAstToTreeData) || []

  return {
    name: ast.type,
    attributes: {
      ...(ast.value !== undefined && { value: String(ast.value) }),
      ...(ast.dataType !== undefined && { type: ast.dataType }),
    },
    children: children.length > 0 ? children : undefined,
  }
}

export default function AstVisualizer({ ast }: AstVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [treeData, setTreeData] = useState<any>(null)

  useEffect(() => {
    // Convert AST to tree data format when the component mounts or ast changes
    if (ast) {
      const data = convertAstToTreeData(ast)
      setTreeData(data)
    }
  }, [ast])

  if (!treeData) {
    return <div>Loading AST visualization...</div>
  }

  return (
    <div className="h-full">
      <h3 className="text-lg font-medium mb-2">Abstract Syntax Tree</h3>
      <div ref={containerRef} className="h-[500px] border rounded-md bg-slate-50">
        <Tree
          data={treeData}
          orientation="vertical"
          pathFunc="step"
          collapsible={true}
          translate={{ x: 300, y: 50 }}
          nodeSize={{ x: 200, y: 100 }}
          renderCustomNodeElement={(rd3tProps) => (
            <g>
              <circle r={15} fill="#69b3a2" />
              <text className="rd3t-label" textAnchor="middle" fill="white" strokeWidth="0.5" dy=".3em">
                {rd3tProps.nodeDatum.name.charAt(0)}
              </text>
              <text className="rd3t-label" textAnchor="start" x="20" fill="black" strokeWidth="0.5">
                {rd3tProps.nodeDatum.name}
              </text>
              {rd3tProps.nodeDatum.attributes && (
                <text className="rd3t-label" textAnchor="start" x="20" y="20" fill="#666" strokeWidth="0.5">
                  {Object.entries(rd3tProps.nodeDatum.attributes)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ")}
                </text>
              )}
            </g>
          )}
        />
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        Scroll to zoom, drag to pan, click nodes to expand/collapse
      </div>
    </div>
  )
}
