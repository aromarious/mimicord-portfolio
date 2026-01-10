import type React from "react"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

interface MarkdownProps {
  content: string
}

const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  return (
    <div className="prose prose-invert max-w-none wrap-break-word">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ node, ...props }) => (
            <a
              {...props}
              className="text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc pl-5 space-y-1 my-2" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal pl-5 space-y-1 my-2" />
          ),
          h1: ({ node, ...props }) => (
            <h1
              {...props}
              className="text-2xl font-bold text-white mt-6 mb-4 border-b border-[#4f545c] pb-2"
            />
          ),
          h2: ({ node, ...props }) => (
            <h2 {...props} className="text-xl font-bold text-white mt-5 mb-3" />
          ),
          h3: ({ node, ...props }) => (
            <h3
              {...props}
              className="text-lg font-bold text-[#dcddde] mt-4 mb-2"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default Markdown
