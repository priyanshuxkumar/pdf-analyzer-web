"use client";

import { cn } from "@/lib/utils";
import { ArrowUp, Menu, PenSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "./ui/textarea";
import { useEffect, useRef, useState } from "react";
import { ChatResponseWait } from "./WaitChatResponse";
import PDFViewer from "./PdfViewer";
import ReactMarkdown from "react-markdown";

type MessageRole = "user" | "assistant";

interface MessagesProp {
  content: string;
  role: MessageRole;
}

export function Chatbox({ className, ...props }: React.ComponentProps<"form">) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [messages, setMessages] = useState<MessagesProp[]>([]);
  const [inputValue, setInputValue] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState<boolean>(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && inputValue) {
      e.preventDefault();
      handleSendQuery(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  // Load old messages
  useEffect(() => {
    const cacheData = JSON.parse(localStorage.getItem("messages") || "[]") ;
    setMessages(cacheData)
  },[]);

  const header = (
    <header className="m-auto flex max-w-96 flex-col gap-5 text-center">
      <h1 className="text-2xl font-semibold leading-none tracking-tight">
        Simple PDF analyzer tool
      </h1>
      <p className="text-muted-foreground text-sm">
        Just upload the PDF file and chat about it{" "}
      </p>
    </header>
  );

  const messageList = (
    <div className="my-4 flex h-fit min-h-full flex-col gap-4">
      {messages?.map((message, index) => (
        <div
          key={index}
          data-role={message.role}
          className={cn(
            "max-w-[80%] px-4 py-2 rounded-2xl text-base data-[role=assistant]:self-start data-[role=user]:self-end data-[role=assistant]:bg-transparent data-[role=user]:bg-blue-500 data-[role=assistant]:text-black data-[role=user]:text-white",
            message.role === "user"
              ? "bg-white border border-gray-200 rounded-br-none"
              : "text-gray-900"
          )}
        >
          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>
        </div>
      ))}
      { isFetching && <ChatResponseWait/> }
    </div>
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileUploading(true);
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      try {
        const user_id = localStorage.getItem("user_id");
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("user_id", user_id ?? "");

        const response = await fetch("http://localhost:8000/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (data.status == "success") {
          localStorage.setItem("user_id", data.user_id);
          setFile(selectedFile);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFileUploading(false);
      }
    } else {
      setFile(null);
    }
  };

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    const user_id = localStorage.getItem("user_id") as string;
    if (!user_id || inputValue.trim() == "") return;

    setIsStreaming(true);
    setIsFetching(true);

    const userMsg = { content: inputValue, role: "user" };
    setMessages((prev : MessagesProp[]) => [...prev, userMsg] as MessagesProp[]);

    const prevData = JSON.parse(localStorage.getItem("messages") || "[]");
    const newData = [...prevData, userMsg];
    localStorage.setItem("messages", JSON.stringify(newData));
    setInputValue("");
    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user_id,
          query: inputValue,
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        const assistantMsg = { content : data?.content, role: "assistant" };
        setMessages((prev : MessagesProp[]) => [...prev, assistantMsg] as MessagesProp[]);

        // Update the localstorage messages -
        const prevData = JSON.parse(localStorage.getItem("messages") || "[]");
        const newData = [...prevData, assistantMsg];
        localStorage.setItem("messages", JSON.stringify(newData));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
      setIsFetching(false);
    }
  };
  
  const handleRemovePdf = () => {
    setFile(null)
  }
  return (
    <div className="bg-gray-50 flex flex-col overflow-hidden">
      <header className="fixed top-0 left-0 right-0 h-12 flex items-center px-4 z-20 bg-gray-50">
        <div className="w-full flex items-center justify-between px-2">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <Menu className="h-5 w-5 text-gray-700" />
            <span className="sr-only">Menu</span>
          </Button>

          <h1 className="text-base font-medium text-gray-800">PDF Chain</h1>

          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <PenSquare className="h-5 w-5 text-gray-700" />
            <span className="sr-only">New Chat</span>
          </Button>
        </div>
      </header>
      <main
        className={cn(
          "flex-grow pb-32 pt-12 px-2 overflow-y-auto max-w-4xl mx-auto ring-none flex h-svh max-h-svh w-full flex-col items-stretch border-none",
          className
        )}
        {...props}
      >
        <div className="flex-1 content-center overflow-y-auto pr-2">
          {messages?.length ? messageList : header}
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-50">
          <form onSubmit={handleSendQuery} className="max-w-4xl mx-auto">
            <div
              className={cn(
                "relative w-full rounded-3xl border border-gray-200 bg-white px-3 py-4 cursor-text",
                isStreaming && "opacity-80"
              )}
            >
              {file && 
                <PDFViewer fileName={file?.name.split(".pdf")[0]} onClose={handleRemovePdf} fileUploading={fileUploading}/>
              }

              <div className="pb-9">
                <Textarea
                  placeholder={
                    isStreaming ? "Waiting for response..." : "Ask Anything"
                  }
                  className="min-h-[24px] max-h-[160px] w-full text-base rounded-3xl border-0 bg-transparent text-gray-900 placeholder:text-gray-400 placeholder:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 pl-2 pr-4 pt-0 pb-0 resize-none overflow-y-auto leading-tight shadow-none"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  readOnly={isFetching || isStreaming}
                />
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                      variant="outline"
                      size="icon"
                      className={cn(
                        "rounded-full h-8 w-8 flex-shrink-0 border-gray-200 p-0 transition-colors",
                        "bg-gray-100 border-gray-300"
                      )}
                      disabled={fileUploading || isFetching || isStreaming}
                    >
                      <Plus className={cn("h-4 w-4 text-gray-500")} />
                      <span className="sr-only">Add</span>
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    size="icon"
                    disabled={!inputValue || isStreaming || isFetching}
                    className={cn(
                      "rounded-full h-8 w-8 border-0 flex-shrink-0 transition-all duration-200 scale-110 bg-gray-200"
                    )}
                  >
                    <ArrowUp className="absolute bottom-1 right-1 size-6 rounded-full" />
                    <span className="sr-only">Submit</span>
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
