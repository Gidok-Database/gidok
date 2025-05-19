import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "@/components/PagedMarkdown/PagedMarkdown.css";

interface Props {
  pages: string[];
}

export default function PagedMarkdown({ pages }: Props) {
  const [markdownPages, setMarkdownPages] = useState(pages);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [modalContent, setModalContent] = useState("");

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

  const scrollWidth = markdownPages.length > 0 ? 800 : 0;

  const openModal = (index: number) => {
    setModalIndex(index);
    setModalContent(markdownPages[index]);
  };

  const saveModal = () => {
    if (modalIndex === null) return;
    const updated = [...markdownPages];
    updated[modalIndex] = modalContent;
    setMarkdownPages(updated);
    setModalIndex(null);
  };

  return (
    <div className="paged-container">
      {/* 본문 */}
      <div className="paged-markdown" ref={contentScrollRef} onScroll={handleScroll}>
        {markdownPages.map((content, idx) => (
          <div id={`page-${idx}`} className="a4-page" key={idx}>
            <div className="page-toolbar">
              <span>Page {idx + 1}</span>
              <button onClick={() => openModal(idx)}>편집하기</button>
            </div>
            <ReactMarkdown>{content}</ReactMarkdown>
            <div className="page-number">Page {idx + 1}</div>
          </div>
        ))}
      </div>

      {/* 모달 */}
      {modalIndex !== null && (
        <div className="edit-modal-backdrop">
          <div className="edit-modal">
            <h3>Page {modalIndex + 1} 수정</h3>
            <textarea
              value={modalContent}
              onChange={(e) => setModalContent(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={saveModal}>저장</button>
              <button onClick={() => setModalIndex(null)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
