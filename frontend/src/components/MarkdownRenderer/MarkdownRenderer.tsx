import ReactMarkdown from "react-markdown";
import "@/components/MarkdownRenderer/MarkdownRenderer";

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="markdown-body">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
