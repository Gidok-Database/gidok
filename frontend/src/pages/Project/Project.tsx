import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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

interface MemberPermission {
  userid: string;
  role: 'admin' | 'viewer';
}

export default function Project() {
  const { name: projectName } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/user/me", {
        withCredentials: true,
      })
      .catch(() => {
        alert("로그인이 필요합니다.");
        navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

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
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPage, setSelectedPage] = useState(0);
  const [members, setMembers] = useState<MemberPermission[]>([
    { userid: 'kar7mp5', role: 'admin' },
    { userid: 'user123', role: 'viewer' },
  ]);
  const [pendingChange, setPendingChange] = useState<{ userid: string; role: 'admin' | 'viewer' } | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  const handlePageUpdate = (index: number, content: string) => {
    const updated = [...markdownPages];
    updated[index] = content;
    setMarkdownPages(updated);
  };

  const handleAddPage = () => {
    setMarkdownPages((prev) => [...prev, "# 새 페이지\n\n내용을 입력하세요."]);
    setSelectedPage(markdownPages.length);
    setTimeout(() => {
      previewRef.current?.scrollTo({ top: previewRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const handleDeletePage = (index: number) => {
    setMarkdownPages(prev => prev.filter((_, i) => i !== index));
    if (selectedPage >= index) {
      setSelectedPage(prev => Math.max(0, prev - 1));
    }
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

  const confirmRoleChange = () => {
    if (pendingChange) {
      const { userid, role } = pendingChange;
      setMembers((prev) =>
        prev.map((m) => (m.userid === userid ? { ...m, role } : m))
      );
      setPendingChange(null);
    }
  };

  const cancelRoleChange = () => {
    setPendingChange(null);
  };

  const toggleSettings = () => {
    setShowSettings((prev) => {
      if (!prev && showHistory) setShowHistory(false);
      return !prev;
    });
  };

  const toggleHistory = () => {
    setShowHistory((prev) => {
      if (!prev && showSettings) setShowSettings(false);
      return !prev;
    });
  };

  if (loading) return null;

  return (
    <div className="layout-container">
      <header className="top-nav">
        <div className="nav-left">
          <button onClick={() => navigate("/")} className="home-button" title="홈으로">
            <span className="material-symbols-outlined">home</span>
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
            onClick={toggleHistory}
            title="커밋 히스토리 보기"
          >
            timeline
          </span>
          <span
            className="material-symbols-outlined"
            style={{ cursor: "pointer" }}
            onClick={toggleSettings}
            title="설정 열기"
          >
            settings
          </span>
        </div>
      </header>
      <div className="body-container">
        <Sidebar pages={markdownPages} />
        <main className="main-content preview-mode">
          <div className="document-preview" ref={previewRef}>
            <PagedMarkdown
              pages={markdownPages}
              onUpdate={handlePageUpdate}
              onDelete={handleDeletePage} // ✅ 여기에 삭제 함수 전달
            />
            <div className="add-page-button" onClick={handleAddPage}>
              <span className="material-symbols-outlined">add_circle</span>
            </div>
          </div>
        </main>

        <aside className={`settings-panel ${showSettings ? "show" : ""}`}>
          <h3>프로젝트 설정</h3>
          <h4>유저 권한 관리</h4>
          <table className="permissions-table">
            <thead>
              <tr>
                <th>유저</th>
                <th>역할</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.userid}>
                  <td>{member.userid}</td>
                  <td>
                    <select
                      value={member.role}
                      onChange={(e) =>
                        setPendingChange({ userid: member.userid, role: e.target.value as 'admin' | 'viewer' })
                      }
                    >
                      <option value="admin">관리자</option>
                      <option value="viewer">읽기 전용</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>

        {pendingChange && (
          <div className="confirm-modal-backdrop">
            <div className="confirm-modal">
              <p>
                {pendingChange.userid} 님의 역할을 "{pendingChange.role}"(으)로 변경하시겠습니까?
              </p>
              <div className="modal-actions">
                <button onClick={confirmRoleChange}>확인</button>
                <button onClick={cancelRoleChange}>취소</button>
              </div>
            </div>
          </div>
        )}

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