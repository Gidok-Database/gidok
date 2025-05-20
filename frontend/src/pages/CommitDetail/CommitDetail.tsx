import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "@/pages/CommitDetail/CommitDetail.css";

export default function CommitDetail() {
  const { name, commitId } = useParams();
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

  // 예시 마크다운 데이터
  const previous = `# 소개\n\n이 문서는 **이전 버전**입니다.\n\n- 항목 A\n- 항목 B`;
  const current = `# 소개\n\n이 문서는 **업데이트된 버전**입니다.\n\n- 항목 A\n- 항목 C`;

  if (loading) return null;

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
