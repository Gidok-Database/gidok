import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "@/pages/CommitDetail/CommitDetail.css";

export default function CommitDetail() {
  const { name: projectName, commitId } = useParams();
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL; 

  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [previous, setPrevious] = useState<string>("(이전 문서 없음)");
  const [current, setCurrent] = useState<string>("(이후 문서 없음)");

  // 유저 인증 및 프로젝트 ID 조회
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/user/me`, { withCredentials: true })
      .then((res) =>
        axios.get(`${API_BASE}/api/project/search?userid=${res.data.userid}`)
      )
      .then((res) => {
        const project = res.data.find((p: any) => p.name === projectName);
        if (!project) throw new Error("프로젝트를 찾을 수 없습니다.");
        setProjectId(project.id);
      })
      .catch(() => {
        alert("로그인이 필요합니다.");
        navigate("/login");
      });
  }, [navigate, projectName]);

  // 커밋 기반 문서 불러오기
  useEffect(() => {
    if (!projectId || !commitId || commitId === "undefined") {
      console.warn("잘못된 커밋 ID:", commitId);
      setLoading(false);
      return;
    }

    const fetchCommitDocs = async () => {
      try {
        // 커밋 체인: 현재 커밋 + 부모 커밋
        const commitRes = await axios.get(`${API_BASE}/api/commit/${projectId}/search`, {
          params: {
            start_hash: commitId,
            start: 0,
            end: 1,
          },
          withCredentials: true,
        });

        console.log(commitRes);
        const commits = commitRes.data;
        const currentCommit = commits[0];
        const parentCommit = commits[1];

        console.log(currentCommit);
        console.log(parentCommit);

        if (currentCommit?.hash) {
          console.log("adfasdfasfasd")
          const currentDocRes = await axios.get(`${API_BASE}/api/project/${projectId}`, {
            params: {
              mode: "develop",
              hash: currentCommit.hash,
              page: currentCommit.page_num
            },
            withCredentials: true,
          });
          console.log(currentDocRes);
          setCurrent(currentDocRes.data?.docs || "(이후 문서 없음)");
        }

        if (parentCommit?.hash) {
          await axios.get(`${API_BASE}/api/project/${projectId}`, {
            params: {
              mode: "develop",
              hash: parentCommit.hash,
              page: currentCommit.page_num
            },
            withCredentials: true,
          }).then((parentDocRes) => {
            setPrevious(parentDocRes.data?.docs || "(이전 문서 없음)");
          }).catch(() => {
            setPrevious("(해당 페이지에 이전 문서 없음)");
          });
        } else {
          setPrevious("(이전 커밋 없음)");
        }
      } catch (err) {
        console.error("커밋 데이터 불러오기 실패", err);
        alert("유효하지 않은 커밋입니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchCommitDocs();
  }, [projectId, commitId]);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="commit-detail-container">
      <div className="header">
        <button className="back-button" onClick={() => navigate(-1)}>← 뒤로가기</button>
        <h2>🧾 커밋 상세 보기: <span className="commit-id">#{commitId}</span></h2>
      </div>

      <div className="commit-compare">
        <div className="commit-panel old">
          <h3>⬅ 이전 문서</h3>
          <div className="markdown-diff old-content">
            <ReactMarkdown>{previous}</ReactMarkdown>
          </div>
        </div>
        <div className="commit-panel new">
          <h3>➡ 이후 문서</h3>
          <div className="markdown-diff new-content">
            <ReactMarkdown>{current}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
