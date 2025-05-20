// ✅ 전체 코드 (Project.tsx)
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
  role: "admin" | "viewer";
}

export default function Project() {
  const { name: projectName } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [userId, setUserId] = useState<string>("");

  const [markdownPages, setMarkdownPages] = useState<string[]>([]);
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPage, setSelectedPage] = useState(0);
  const [members, setMembers] = useState<MemberPermission[]>([]);
  const [pendingChange, setPendingChange] = useState<{
    userid: string;
    role: "admin" | "viewer";
  } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/user/me", { withCredentials: true })
      .then((res) => {
        setUserId(res.data.userid);
        return axios.get(`http://localhost:8000/api/project/search?userid=${res.data.userid}&role=admin`);
      })
      .then((res) => {
        const project = res.data.find((p: any) => p.name === projectName);
        if (!project) throw new Error("프로젝트를 찾을 수 없습니다.");
        setProjectId(project.id);
      })
      .catch(() => {
        alert("로그인이 필요합니다.");
        navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [navigate, projectName]);

  useEffect(() => {
    if (projectId !== null) {
      loadCommits(projectId, selectedPage);
    }
  }, [projectId, selectedPage]);

  const loadCommits = (projId: number, pageIdx: number) => {
    axios
      .get(`http://localhost:8000/api/commit/${projId}/search`, {
        params: {
          mode: "develop",
          start: 0,
          end: 50,
        },
        withCredentials: true,
      })
      .then((res) => {
        if (!Array.isArray(res.data)) {
          console.error("[ERROR] 잘못된 커밋 응답 형식:", res.data);
          alert("커밋 데이터를 불러오지 못했습니다.");
          return;
        }

        const parsed: CommitData[] = res.data.map((c: any) => ({
          id: c.hash,
          message: c.title || "(제목 없음)",
          author: c.user_name,
          date: c.date,
          parents: c.parent_hash ? [c.parent_hash] : [],
          pageIndex: (c.max_page || 1) - 1,
          desc: c.desc || "",
        }));

        console.log("[DEBUG] parsed commits:", parsed);

        if (parsed.length === 0) {
          console.warn("[WARN] 커밋이 비어 있음. 초기화된 페이지로 설정");
          setMarkdownPages(["# Page 1\n\n(내용 없음)"]);
          setCommits([]);
          setMembers([]);
          return;
        }

        const maxPageIndex = Math.max(...parsed.map((c) => c.pageIndex));
        const newPages = Array.from({ length: maxPageIndex + 1 }, (_, i) => {
          const latest = parsed
            .filter((c) => c.pageIndex === i)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          return latest?.desc || `# Page ${i + 1}\n\n(내용 없음)`;
        });

        console.log("[DEBUG] constructed pages from commits:", newPages);

        setMarkdownPages(newPages);
        setCommits(parsed.filter((c) => c.pageIndex === pageIdx));

        const usersMap: Record<string, MemberPermission> = {};
        res.data.forEach((c: any) => {
          if (c.user_id) {
            usersMap[c.user_id] = { userid: c.user_id, role: "viewer" };
          }
        });
        setMembers(Object.values(usersMap));
      })
      .catch((err) => {
        console.error("[ERROR] 커밋 로딩 실패:", err);
        alert("커밋 불러오기 실패");
      });
  };

  const handlePageUpdate = (index: number, content: string) => {
    const updated = [...markdownPages];
    updated[index] = content;
    setMarkdownPages(updated);
  };

  const handleAddPage = async () => {
    if (!projectId) {
      alert("프로젝트 ID가 없습니다.");
      return;
    }

    const pageNumber = markdownPages.length + 1;
    const docs = `# 새 페이지\n\n내용을 입력하세요.`;

    try {
      const res = await axios.post(
        `http://localhost:8000/api/commit/${projectId}`,
        {
          title: "새 페이지",
          desc: docs,
          docs: docs,
          page: pageNumber,
          old_start: 0,
          old_end: 0,
        },
        {
          withCredentials: true,
        }
      );

      console.log("[DEBUG] 커밋 생성 응답:", res.data);

      if (res.data.msg === "success") {
        // ✅ 서버 성공 시: 페이지 추가 및 이동
        setMarkdownPages((prev) => [...prev, docs]);
        setSelectedPage(pageNumber - 1); // 0-index
        loadCommits(projectId, pageNumber - 1);

        setTimeout(() => {
          previewRef.current?.scrollTo({
            top: previewRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      } else {
        // ⚠️ 서버는 200 OK지만 실패 메시지 반환
        alert("페이지 커밋 생성 실패: " + res.data.msg);
        console.error("[DEBUG] 커밋 실패:", res.data);
      }
    } catch (err: any) {
      // ❌ 네트워크 또는 인증 오류
      console.error("[ERROR] 페이지 추가 요청 실패:", err);
      if (axios.isAxiosError(err)) {
        alert("커밋 요청 실패: " + err.response?.data?.msg || err.message);
      } else {
        alert("알 수 없는 오류가 발생했습니다.");
      }
    }
  };

  const handleDeletePage = (index: number) => {
    setMarkdownPages((prev) => prev.filter((_, i) => i !== index));
    if (selectedPage >= index) {
      setSelectedPage((prev) => Math.max(0, prev - 1));
    }
  };

  const handleExportPdf = async () => {
    const container = previewRef.current;
    if (!container) return;

    const pdf = new jsPDF("p", "pt", "a4");
    const pageEls = container.querySelectorAll(".a4-page");

    for (let i = 0; i < pageEls.length; i++) {
      const el = pageEls[i] as HTMLElement;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
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

  const cancelRoleChange = () => setPendingChange(null);
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
          <button onClick={handleExportPdf} className="export-button">PDF로 내보내기</button>
          <span className="material-symbols-outlined" onClick={toggleHistory} title="커밋 히스토리 보기">timeline</span>
          <span className="material-symbols-outlined" onClick={toggleSettings} title="설정 열기">settings</span>
        </div>
      </header>
      <div className="body-container">
        <Sidebar pages={markdownPages} />
        <main className="main-content preview-mode">
          <div className="document-preview" ref={previewRef}>
            <PagedMarkdown
              pages={markdownPages}
              onUpdate={handlePageUpdate}
              onDelete={handleDeletePage}
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
              <tr><th>유저</th><th>역할</th></tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.userid}>
                  <td>{member.userid}</td>
                  <td>
                    <select
                      value={member.role}
                      onChange={(e) =>
                        setPendingChange({
                          userid: member.userid,
                          role: e.target.value as "admin" | "viewer",
                        })
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
              <p>{pendingChange.userid} 님의 역할을 "{pendingChange.role}"(으)로 변경하시겠습니까?</p>
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
                  <option key={idx} value={idx}>Page {idx + 1}</option>
                ))}
              </select>
            </div>
            <ul className="git-graph-list">
              {commits.map((commit, i, filtered) => (
                <li
                  className="graph-item"
                  key={commit.id}
                  onClick={() => navigate(`/project/${projectName}/commit/${commit.id}`)}
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
