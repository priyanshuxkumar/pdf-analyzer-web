"use client"

import { FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Loading from "./Loading"

interface PDFComponentProps {
  fileName: string
  onClose: () => void
  fileUploading: boolean
}

export default function PDFViewer({ fileName, onClose, fileUploading}: PDFComponentProps) {
  return (
    <div className="inset-0 flex items-center z-50 mb-4">
      <div className="bg-slate-100 rounded-xl max-w-md w-full p-2 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 text-white hover:bg-slate-50 rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5 text-black" />
        </Button>

        <div className="flex items-center gap-4">
          <div className="bg-pink-500 rounded-xl p-3 flex items-center justify-center">
            {fileUploading ? <Loading/> : <FileText/>}
            
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-medium">{fileName}</span>
            <span className="text-sm">PDF</span>
          </div>
        </div>
      </div>
    </div>
  )
}
