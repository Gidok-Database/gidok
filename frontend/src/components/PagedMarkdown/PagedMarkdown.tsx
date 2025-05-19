import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "@/components/PagedMarkdown/PagedMarkdown.css";

interface Props {
  pages: string[];
  onUpdate: (index: number, content: string, message: string) => void;
  onDelete: (index: number) => void; // ✅ 삭제 콜백 추가
}

export default function PagedMarkdown({ pages, onUpdate, onDelete }: Props) {
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [modalContent, setModalContent] = useState("");
  const [commitMessage, setCommitMessage] = useState("");

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

  const openModal = (index: number) => {
    setModalIndex(index);
    setModalContent(pages[index]);
    setCommitMessage(""); // 커밋 메시지는 초기화
  };

  const saveModal = () => {
    if (modalIndex === null) return;

    if (!commitMessage.trim()) {
      alert("커밋 메시지를 입력해주세요.");
      return;
    }

    const confirmed = window.confirm("정말로 저장하시겠습니까?");
    if (!confirmed) return;

    onUpdate(modalIndex, modalContent, commitMessage);
    setModalIndex(null);
  };

  const handleDelete = (index: number) => {
    const confirmed = window.confirm(`Page ${index + 1}을 삭제하시겠습니까?`);
    if (confirmed) {
      onDelete(index);
    }
  };

  return (
    <div className="paged-container">
      <div className="scrollbar-top" ref={topScrollRef} onScroll={handleTopScroll}>
        <div style={{ width: `${scrollWidth}px`, height: 1 }} />
      </div>

      <div className="paged-markdown" ref={contentScrollRef} onScroll={handleScroll}>
        {pages.map((content, idx) => (
          <div key={idx} className="page-wrapper">
            <div className="page-toolbar">
              <button onClick={() => openModal(idx)}>편집하기</button>
              <button onClick={() => handleDelete(idx)} style={{ marginLeft: "0.5rem", color: "red" }}>
                삭제
              </button>
            </div>
            <div id={`page-${idx}`} className="a4-page">
              <ReactMarkdown>{content}</ReactMarkdown>
              <div className="page-number">Page {idx + 1}</div>
            </div>
          </div>
        ))}
      </div>

      {modalIndex !== null && (
        <div className="edit-modal-backdrop">
          <div className="edit-modal">
            <h3>Page {modalIndex + 1} 수정</h3>
            <textarea
              className="commit-message-input"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="커밋 메시지를 입력하세요"
            />
            <textarea
              className="content-editor"
              value={modalContent}
              onChange={(e) => setModalContent(e.target.value)}
              placeholder="수정할 내용을 입력하세요"
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
