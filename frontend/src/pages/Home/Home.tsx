import { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Sidebar from "@/components/Sidebar/Sidebar";
import PagedMarkdown from "@/components/PagedMarkdown/PagedMarkdown";
import "@/pages/Home/Home.css";

export default function Home() {
  const [markdownPages, setMarkdownPages] = useState([
    `# 📝 프로젝트 개요\n\n- 이 시스템은 마크다운 문서를 렌더링합니다.\n- 페이지 단위로 나뉩니다.`,
    `## ⏱ 개발 일정\n\n1. 구조 설계\n2. 커밋 기능\n3. 렌더링\n4. 배포`,
    `## ⚙️ 기술 스택\n\n- React\n- TypeScript\n- FastAPI\n- PostgreSQL`,
    `## ⚙️ 기술 스택\n\n- React\n- TypeScript\n- FastAPI\n- PostgreSQL`,
    `## ⚙️ 기술 스택\n\n- React\n- TypeScript\n- FastAPI\n- PostgreSQL`,
    `## ⚙️ 기술 스택\n\n- React\n- TypeScript\n- FastAPI\n- PostgreSQL`,
  ]);

  const previewRef = useRef<HTMLDivElement>(null);

  const handlePageUpdate = (index: number, content: string) => {
    const updated = [...markdownPages];
    updated[index] = content;
    setMarkdownPages(updated);
  };

  const handleExportPdf = async () => {
    const container = previewRef.current;
    if (!container) return;

    const pdf = new jsPDF("p", "pt", "a4");
    const pageEls = container.querySelectorAll(".a4-page");

    for (let i = 0; i < pageEls.length; i++) {
      const el = pageEls[i] as HTMLElement;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save("document_preview.pdf");
  };

  return (
    <div className="layout-container">
      <header className="top-nav">
        <div className="nav-left">
          <span className="material-symbols-outlined">description</span>
        </div>
        <div className="nav-right">
          <button onClick={handleExportPdf} className="export-button">
            PDF로 내보내기
          </button>
          <span className="material-symbols-outlined">notifications</span>
        </div>
      </header>

      <div className="body-container">
        <Sidebar pages={markdownPages} />
        <main className="main-content preview-mode">
          <div className="document-preview" ref={previewRef}>
            <PagedMarkdown pages={markdownPages} onUpdate={handlePageUpdate} />
          </div>
        </main>
      </div>
    </div>
  );
}
