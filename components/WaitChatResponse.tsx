import { Ellipsis } from "lucide-react"

export const ChatResponseWait = () => {
    return (
      <div>
        <div className="bg-slate-100 w-fit rounded-xl px-2  animate-bounce">
          <Ellipsis/>
        </div>
      </div>
    )
  }