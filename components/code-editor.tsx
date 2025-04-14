"use client"

import { useRef } from "react"
import Editor from "@monaco-editor/react"

interface CodeEditorProps {
  code: string
  onChange: (value: string) => void
}

export default function CodeEditor({ code, onChange }: CodeEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
  }

  return (
    <Editor
      height="100%"
      defaultLanguage="javascript"
      value={code}
      onChange={(value) => onChange(value || "")}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
      }}
      theme="vs-dark"
    />
  )
}
