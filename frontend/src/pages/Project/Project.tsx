import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Sidebar from "@/components/Sidebar/Sidebar";
import PagedMarkdown from "@/components/PagedMarkdown/PagedMarkdown";
import "@/pages/Project/Project.css";

interface CommitData {
  id: string;
  message: string;
  author: string;
  date: string;
  parents: string[];
  pageIndex: number;
}

export default function Project() {
  const { name: projectName } = useParams();
  const navigate = useNavigate();

  const [markdownPages, setMarkdownPages] = useState([
    `# 새 페이지\n\n 내용을 작성해주세요.`,
  ]);

  const [commits] = useState<CommitData[]>([
    {
      id: "a1b2c3d",
      message: "Initial commit",
      author: "MinSup Kim",
      date: "2024-05-17 14:32",
      parents: [],
      pageIndex: 0,
    },
    {
      id: "a2b2c3d",
      message: "test commit",
      author: "MinSup Kim",
      date: "2024-05-17 14:32",
      parents: ["a1b2c3d"],
      pageIndex: 0,
    },
    {
      id: "d4e5f6g",
      message: "Add README",
      author: "MinSup Kim",
      date: "2024-05-18 09:10",
      parents: [],
      pageIndex: 1,
    },
    {
      id: "h7i8j9k",
      message: "Refactor layout",
      author: "Kar7mp5",
      date: "2024-05-19 12:50",
      parents: [],
      pageIndex: 2,
    },
  ]);

  const [showHistory, setShowHistory] = useState(false);
  const [selectedPage, setSelectedPage] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  const handlePageUpdate = (index: number, content: string) => {
    const updated = [...markdownPages];
    updated[index] = content;
    setMarkdownPages(updated);
  };

  const handleAddPage = () => {
    setMarkdownPages((prev) => [...prev, "# 새 페이지\n\n내용을 입력하세요."]);
    setSelectedPage(markdownPages.length); // 새 페이지 자동 선택

    setTimeout(() => {
      previewRef.current?.scrollTo({ top: previewRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
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

    pdf.save("새 문서.pdf");
  };

  return (
    <div className="layout-container">
      <header className="top-nav">
        <div className="nav-left">
          <button onClick={() => navigate("/")} className="home-button">
            ← 홈으로
          </button>
          <span className="project-title">{projectName}</span>
        </div>
        <div className="nav-right">
          <button onClick={handleExportPdf} className="export-button">
            PDF로 내보내기
          </button>
          <span
            className="material-symbols-outlined"
            style={{ cursor: "pointer" }}
            onClick={() => setShowHistory(!showHistory)}
            title="커밋 히스토리 보기"
          >
            timeline
          </span>
        </div>
      </header>
      <div className="body-container">
        <Sidebar pages={markdownPages} />
        <main className="main-content preview-mode">
          <div className="document-preview" ref={previewRef}>
            <PagedMarkdown pages={markdownPages} onUpdate={handlePageUpdate} />
            <div className="add-page-button" onClick={handleAddPage}>
              <span className="material-symbols-outlined">add_circle</span>
            </div>
          </div>
        </main>

        <div className="history-panel-wrapper">
          <aside className={`history-panel ${showHistory ? "show" : ""}`}>
            <h3>커밋 히스토리</h3>
            <div className="page-select-wrapper">
              <label htmlFor="page-select">페이지 선택: </label>
              <select
                id="page-select"
                value={selectedPage}
                onChange={(e) => setSelectedPage(Number(e.target.value))}
              >
                {markdownPages.map((_, idx) => (
                  <option key={idx} value={idx}>
                    Page {idx + 1}
                  </option>
                ))}
              </select>
            </div>
            <ul className="git-graph-list">
              {commits
                .filter((commit) => commit.pageIndex === selectedPage)
                .map((commit, i, filtered) => (
                  <li
                    className="graph-item"
                    key={commit.id}
                    onClick={() =>
                      navigate(`/project/${projectName}/commit/${commit.id}`)
                    }
                  >
                    <div className="graph-line">
                      <div className="circle" />
                      {i !== filtered.length - 1 && <div className="vertical-line" />}
                    </div>
                    <div className="commit-info">
                      <div className="commit-message">{commit.message}</div>
                      <div className="commit-meta">
                        <span>{commit.author}</span> · <span>{commit.date}</span>
                      </div>
                      <div className="commit-hash">#{commit.id.slice(0, 7)}</div>
                    </div>
                  </li>
                ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}