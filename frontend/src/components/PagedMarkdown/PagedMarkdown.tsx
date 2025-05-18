import React, { useRef } from "react";
import ReactMarkdown from "react-markdown";
import "@/components/PagedMarkdown/PagedMarkdown.css";

interface Props {
  pages: string[];
}

export default function PagedMarkdown({ pages }: Props) {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (topScrollRef.current && contentScrollRef.current) {
      topScrollRef.current.scrollLeft = contentScrollRef.current.scrollLeft;
    }
  };

  const handleTopScroll = () => {
    if (topScrollRef.current && contentScrollRef.current) {
      contentScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const scrollWidth = pages.length > 0 ? 800 : 0;

  return (
    <div className="paged-container">
      {/* 상단 스크롤바 */}
      <div className="scrollbar-top" ref={topScrollRef} onScroll={handleTopScroll}>
        <div style={{ width: `${scrollWidth}px`, height: 1 }} />
      </div>

      {/* 페이지 내용 */}
      <div className="paged-markdown" ref={contentScrollRef} onScroll={handleScroll}>
        {pages.map((md, idx) => (
          <div id={`page-${idx}`} className="a4-page" key={idx}>
            <ReactMarkdown>{md}</ReactMarkdown>
            <div className="page-number">Page {idx + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
