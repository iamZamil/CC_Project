import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { CompilerError } from "@/lib/types"

interface ErrorDisplayProps {
  errors: CompilerError[]
}

export default function ErrorDisplay({ errors }: ErrorDisplayProps) {
  return (
    <div className="space-y-2">
      {errors.map((error, index) => (
        <Alert key={index} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            Error {error.line > 0 ? `at line ${error.line}${error.column > 0 ? `, column ${error.column}` : ""}` : ""}
          </AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
