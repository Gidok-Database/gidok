// ✅ 전체 코드 (Project.tsx) - 권한(role) admin/member/viewer 적용
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Sidebar from "@/components/Sidebar/Sidebar";
import PagedMarkdown from "@/components/PagedMarkdown/PagedMarkdown";
import { diffLines } from "diff";

import "@/pages/Project/Project.css";

interface CommitData {
  id: string;
  message: string;
  author: string;
  date: string;
  parents: string[];
  pageIndex: number;
  desc?: string;
  docs?: string;
  mode?: string;
}

interface MemberPermission {
  userid: string;
  role: "admin" | "member" | "viewer";
}

export default function Project() {
  const { name: projectName } = useParams();
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL; 

  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<"admin" | "member" | "viewer">("viewer");

  const [markdownPages, setMarkdownPages] = useState<string[]>([]);
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPage, setSelectedPage] = useState(0);
  const [members, setMembers] = useState<MemberPermission[]>([]);
  const [pendingChange, setPendingChange] = useState<MemberPermission | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [inviteUserId, setInviteUserId] = useState("");

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/user/me`, { withCredentials: true })
      .then((res) => {
        setUserId(res.data.userid);
        return axios.get(`${API_BASE}/api/project/search?userid=${res.data.userid}`);
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
      fetchProjectPages(projectId);
      loadCommits(projectId, selectedPage);
      loadProjectMembers(projectId); 
    }
    if (projectId !== null && userId) {
    // 🔁 현재 유저의 권한만 조회
    axios
      .get(`${API_BASE}/api/project/${projectId}/users`, {
        params: { user_id: userId },
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.length > 0) {
          setUserRole(res.data[0].role);
        } else {
          setUserRole("viewer"); // 해당 프로젝트에 속하지 않은 경우
        }
      })
      .catch((err) => {
        console.error("[ERROR] 권한 정보 불러오기 실패:", err);
        setUserRole("viewer");
      });
    }
  }, [projectId, selectedPage]);

  useEffect(() => {
    if (projectId !== null && userId) {
      axios
        .get(`${API_BASE}/api/project/${projectId}/users`, {
          params: { user_id: userId },
          withCredentials: true,
        })
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setUserRole(res.data[0].role); // 정확한 권한 세팅
          } else {
            setUserRole("viewer"); // 프로젝트에 속하지 않은 경우
          }
        })
        .catch((err) => {
          console.error("[ERROR] 권한 조회 실패:", err);
          setUserRole("viewer"); // 기본값
        });
    }
  }, [projectId, userId]);

  const loadProjectMembers = async (projId: number) => {
    try {
      const res = await axios.get(`${API_BASE}/api/project/${projId}/users`, {
        withCredentials: true,
      });
      setMembers(res.data); // 응답은 [{userid, name, role}]
    } catch (err) {
      console.error("[ERROR] 유저 권한 불러오기 실패:", err);
      setMembers([]);
    }
  };

  const fetchProjectPages = async (projId: number) => {
    try {
      // 1. 먼저 max_page 계산
      const commitRes = await axios.get(`${API_BASE}/api/commit/${projId}/search`, {
        params: { mode: "develop", start: 0, end: 50 },
        withCredentials: true,
      });

      const maxPage = Math.max(...commitRes.data.map((c: any) => c.max_page || 1));

      // 2. 각 페이지를 순회하며 요청
      const pages: string[] = [];
      for (let i = 1; i <= maxPage; i++) {
        try {
          const res = await axios.get(`${API_BASE}/api/project/${projId}`, {
            params: {
              mode: "release",
              page: i,
            },
            withCredentials: true,
          });
          pages.push(res.data?.docs || `# Page ${i}\n\n(내용 없음)`);
        } catch (err: any) {
          console.error(`[ERROR] ${i}페이지 불러오기 실패`, err);
          pages.push(`# Page ${i}\n\n(에러 발생)`);
        }
      }

      setMarkdownPages(pages);
    } catch (err) {
      console.error("[ERROR] 최대 페이지 수 계산 실패:", err);
      setMarkdownPages([]);
    }
  };

  const fetchProjectPage = async (projId: number, page: number): Promise<string> => {
    const res = await axios.get(`${API_BASE}/api/project/${projId}`, {
      params: {
        mode: "develop",
        page: String(page),
      },
      withCredentials: true,
    });
    return res.data?.docs || "";
  };

  const loadCommits = (projId: number, pageIdx: number) => {
    axios
      .get(`${API_BASE}/api/commit/${projId}/search`, {
        params: { mode: "develop", start: 0, end: 50 },
        withCredentials: true,
      })
      .then((res) => {
        if (!Array.isArray(res.data)) return;
        const parsed: CommitData[] = res.data.map((c: any) => ({
          id: c.hash,
          message: c.title || "(제목 없음)",
          author: c.user_name,
          date: c.date,
          parents: c.parent_hash ? [c.parent_hash] : [],
          pageIndex: (c.page_num || 1) - 1,
          desc: c.desc || "",
          mode: c.mode,
        }));
        setCommits(parsed.filter((c) => c.pageIndex === pageIdx));
      });
  };

  /**
   * 정확한 수정 범위(old_start, old_end)를 계산한다.
   */
/**
 * 정확한 수정 범위(old_start, old_end)를 계산한다.
 * - 추가/삭제/변경이 포함된 줄 범위를 모두 감지함
 * - 아무 변화가 없으면 [0, 0] 반환
 */
  const getLineRange = (oldText: string, newText: string): [number, number] => {
    const diffs = diffLines(oldText, newText);

    let oldLineIndex = 0;
    let start = -1;
    let end = -1;

    for (const part of diffs) {
      const count = part.count ?? 0;

      if (part.removed || part.added) {
        if (start === -1) start = oldLineIndex;
        end = oldLineIndex + count;
      }

      if (!part.added) {
        oldLineIndex += count;
      }
    }

    if (start === -1) return [0, 0];
    return [start, end];
  };

  const handlePageUpdate = async (
    index: number,
    newContent: string,
    title: string,
    desc: string
  ) => {
    if (!projectId) return;

    const oldText = markdownPages[index];
    const cleanedContent = newContent; // .trimEnd();
    if (oldText === cleanedContent) return;

    console.log(oldText);
    console.log(cleanedContent);
    const [old_start, old_end] = getLineRange(oldText, cleanedContent);

    console.log(old_start, old_end);
    const newLines = cleanedContent.split("\n");

    let docs: string;

    if (old_start === old_end) {
      // 삭제 없이 줄이 삽입된 경우: 해당 위치의 한 줄만 추출
      docs = newLines[old_start] ?? "";
    } else {
      // 줄 삭제/변경/복합 변경의 경우: 범위 슬라이싱
      const changedLines = newLines.slice(old_start, old_end);
      docs = changedLines.join("\n");
    }
    
    try {
      const commitRes = await axios.post(
        `${API_BASE}/api/commit/${projectId}`,
        {
          page: index + 1,
          title,
          desc,
          docs,
          old_start,
          old_end,
        },
        { withCredentials: true }
      );

      const hash = commitRes.data?.hash;
      if (hash) {
        await axios.patch(
          `${API_BASE}/api/commit/${projectId}`,
          { cmd: "push", hash },
          { withCredentials: true }
        );
        await axios.patch(
          `${API_BASE}/api/commit/${projectId}`,
          { cmd: "merge", hash },
          { withCredentials: true }
        );

        const updatedContent = await fetchProjectPage(projectId, index + 1);
        const updated = [...markdownPages];
        updated[index] = updatedContent;
        // setMarkdownPages(updated);
        await loadCommits(projectId, index);
      }
    } catch (err) {
      alert("페이지 수정 커밋 실패");
    }
  };

  const handleAddPage = async () => {
    if (!projectId) return;
    const pageNumber = markdownPages.length + 1;
    const docs = `# 새 페이지\n\n내용을 입력하세요.`;
    try {
      const commitRes = await axios.post(`${API_BASE}/api/commit/${projectId}`, {
        page: pageNumber,
        title: "초기 커밋",
        desc: `${pageNumber} 페이지 추가`,
        docs,
        old_start: 0,
        old_end: 0,
      }, { withCredentials: true });

      const hash = commitRes.data?.hash;
      if (!hash) throw new Error("커밋 실패");

      await axios.patch(`${API_BASE}/api/commit/${projectId}`, { cmd: "push", hash }, { withCredentials: true });
      await axios.patch(`${API_BASE}/api/commit/${projectId}`, { cmd: "merge", hash }, { withCredentials: true });
      await axios.patch(`${API_BASE}/api/commit/${projectId}`, { cmd: "promote", hash }, { withCredentials: true });

      await fetchProjectPages(projectId);
      setSelectedPage(pageNumber - 1);
      loadCommits(projectId, pageNumber);
    } catch {
      alert("페이지 추가 실패");
    }
  };

  const handleDeletePage = (index: number) => {
    setMarkdownPages((prev) => prev.filter((_, i) => i !== index));
    if (selectedPage >= index) setSelectedPage((prev) => Math.max(0, prev - 1));
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

  const confirmRoleChange = async () => {
    if (pendingChange && projectId) {
      const { userid, role } = pendingChange;

      // ✅ 현재 관리자가 1명이고 그 관리자를 바꾸려는 경우 차단
      const adminCount = members.filter((m) => m.role === "admin").length;
      const isTargetAdmin = members.find((m) => m.userid === userid)?.role === "admin";

      if (adminCount === 1 && isTargetAdmin && role !== "admin") {
        alert("관리자는 최소 1명 이상 필요합니다.");
        setPendingChange(null);
        return;
      }

      try {
        await axios.patch(
          `${API_BASE}/api/project/${projectId}`,
          {},
          {
            params: { userid, role },
            withCredentials: true,
          }
        );
        await loadProjectMembers(projectId); // 변경 후 다시 불러오기
        setPendingChange(null);
      } catch (err) {
        alert("권한 변경에 실패했습니다.");
      }
    }
  };

  const applyCommit = async (hash: string) => {
    if (!projectId) return;
    try {
      await axios.patch(
        `${API_BASE}/api/commit/${projectId}`,
        { cmd: "promote", hash },
        { withCredentials: true }
      );

      await fetchProjectPages(projectId);
      await loadCommits(projectId, selectedPage);

      // ✅ 권한 정보 최신화
      const res = await axios.get(`${API_BASE}/api/project/${projectId}/users`, {
        params: { user_id: userId },
        withCredentials: true,
      });
      if (res.data.length > 0) {
        setUserRole(res.data[0].role);
      } else {
        setUserRole("viewer");
      }

      alert("문서에 적용되었습니다.");
    } catch (err) {
      alert("문서 적용에 실패했습니다.");
    }
  };

  const handleInvite = async () => {
    if (!projectId || !inviteUserId.trim()) {
      alert("유저 ID를 입력해주세요.");
      return;
    }

    try {
      // ✅ 유저가 실제로 존재하는지 확인
      const res = await axios.get("${API_BASE}/api/user", {
        params: { user_id: inviteUserId.trim() },
        withCredentials: true,
      });

      if (!res.data || res.data.length === 0) {
        alert("해당 유저를 찾을 수 없습니다.");
        return;
      }

      // ✅ 이미 초대된 유저인지 확인
      if (members.some((m) => m.userid === inviteUserId.trim())) {
        alert("이미 초대된 유저입니다.");
        return;
      }

      // ✅ viewer 권한 부여
      await axios.patch(
        `${API_BASE}/api/project/${projectId}`,
        {},
        {
          params: { userid: inviteUserId.trim(), role: "viewer" },
          withCredentials: true,
        }
      );

      alert("초대 완료 (viewer 권한)");
      setInviteUserId("");
      await loadProjectMembers(projectId);
    } catch (err) {
      alert("초대 실패");
      console.error(err);
    }
  };


  const cancelRoleChange = () => setPendingChange(null);
  const toggleSettings = () => setShowSettings((prev) => (!prev && showHistory ? (setShowHistory(false), true) : !prev));
  const toggleHistory = () => setShowHistory((prev) => (!prev && showSettings ? (setShowSettings(false), true) : !prev));

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
          <span className="material-symbols-outlined" onClick={toggleHistory}>timeline</span>
          <span className="material-symbols-outlined" onClick={toggleSettings}>settings</span>
        </div>
      </header>
      <div className="body-container">
        <Sidebar pages={markdownPages} />
        <main className="main-content preview-mode">
          <div className="document-preview" ref={previewRef}>
          <PagedMarkdown pages={markdownPages} onUpdate={handlePageUpdate} onDelete={handleDeletePage} />
              <div className="add-page-button" onClick={handleAddPage}>
              <span className="material-symbols-outlined">add_circle</span>
            </div>
          </div>
        </main>

        <aside className={`settings-panel ${showSettings ? "show" : ""}`}>
          <h4>유저 초대</h4>
          <div className="invite-form">
            <input
              type="text"
              placeholder="유저 ID 입력"
              value={inviteUserId}
              onChange={(e) => setInviteUserId(e.target.value)}
            />
            <button onClick={handleInvite}>초대</button>
          </div>
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
                      onChange={(e) => setPendingChange({ userid: member.userid, role: e.target.value as MemberPermission["role"] })}
                    >
                      <option value="admin">관리자</option>
                      <option value="member">멤버</option>
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
              <select id="page-select" value={selectedPage} onChange={(e) => setSelectedPage(Number(e.target.value))}>
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
                    <div className="commit-title">{commit.message}</div>
                    <div className="commit-description">{commit.desc}</div>
                    <div className="commit-meta">
                      <span>{commit.author}</span> · <span>{commit.date}</span>
                    </div>
                    <div className="commit-hash">#{commit.id.slice(0, 7)}</div>
                  </div>
                  {userRole === "admin" && commit.mode === "develop" && (
                    <button
                      type="button"
                      className="apply-commit-button"
                      title="이 커밋을 release 문서에 적용합니다"
                      onClick={(e) => {
                        e.stopPropagation();     // 커밋 상세 페이지 이동 방지
                        e.preventDefault();      // 기본 버튼 동작 방지
                        applyCommit(commit.id);  // merge + markdownPages 갱신
                      }}
                    >
                      문서에 적용
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
