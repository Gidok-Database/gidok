import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import ProjectForm from "@/components/ProjectForm/ProjectForm";
import "@/pages/Home/Home.css";

const userInfoDefault = {
  name: "",
  userid: "",
  email: "",
  org: "",
  desc: "",
  avatarUrl: "https://avatars.githubusercontent.com/u/00000000",
};

interface ProjectType {
  name: string;
  permission: "admin" | "user";
  type: "docs" | "ppt";
  updated: string;
}

export default function Home() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(userInfoDefault);
  const [loading, setLoading] = useState(true);
  const [repositories, setRepositories] = useState<ProjectType[]>([]);

  // ✅ 로그인 검증 및 유저 정보 + 프로젝트 목록 불러오기
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/user/me", {
        params: { user_id: undefined, user_name: undefined, user_email: undefined },
        withCredentials: true,
      })
      .then((res) => {
        const user = res.data;
        setUserInfo({
          userid: user.userid,
          name: user.name,
          email: user.email,
          org: user.org,
          desc: user.desc,
          avatarUrl: user.avatarUrl || userInfoDefault.avatarUrl,
        });
        return axios.get(`http://localhost:8000/api/project/search?userid=${user.userid}&role=admin`);
      })
      .then((res) => {
        const fetchedRepos = res.data.map((proj: any) => ({
          name: proj.name,
          permission: "admin",
          type: "docs",
          updated: "알 수 없음",
        }));
        setRepositories(fetchedRepos);
      })
      .catch((err) => {
        alert("로그인이 필요합니다.");
        navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8000/api/user/logout", {}, {
        withCredentials: true,
      });
      alert("로그아웃 되었습니다.");
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃 실패");
    }
  };

  const handleAddRepository = async (formData: { name: string; org?: string; desc?: string }) => {
    try {
      // 1. 프로젝트 생성 요청
      const res = await axios.post("http://localhost:8000/api/project/", {
        name: formData.name,
        org: formData.org,
        desc: formData.desc,
      }, { withCredentials: true });

      const projectId = res.data?.project_id;
      if (!projectId) {
        console.error("프로젝트 ID 누락:", res.data);
        alert("프로젝트 생성에 실패했습니다.");
        return;
      }

      // 2. 첫 커밋 요청 (commit API는 /api/commit/{project_id})
      const commitRes = await axios.post(`http://localhost:8000/api/commit/${projectId}`, {
        page: 1, // ✅ FastAPI는 page <= 0일 때 에러
        docs: "# 새 문서 시작\n\n이곳에 내용을 작성하세요.",
        title: "새 문서 시작",
        desc: "프로젝트 생성 시 자동 커밋",
        old_start: 0,
        old_end: 0
      }, { withCredentials: true });

      if (commitRes.data?.msg !== "success") {
        console.error("초기 커밋 실패:", commitRes.data);
        alert("초기 커밋 생성에 실패했습니다.");
        return;
      }

      // 3. 프로젝트 목록에 추가
      const newRepo: ProjectType = {
        name: formData.name,
        permission: "admin",
        type: "docs",
        updated: "방금 생성됨",
      };

      setRepositories((prev) => [newRepo, ...prev]);
    } catch (err) {
      console.error("프로젝트 생성 또는 커밋 실패:", err);
      alert("프로젝트 생성 또는 커밋 실패");
    }
  };

  if (loading) return null;

  return (
    <div className="github-page">
      <aside className="profile-sidebar">
        <img src={userInfo.avatarUrl} alt="avatar" className="avatar" />
        <h2>{userInfo.name}</h2>
        <p className="username">@{userInfo.userid}</p>
        <p className="bio">{userInfo.email}</p>
        <p className="location">📍 {userInfo.org}</p>
        <p className="follow">👥 {userInfo.desc}</p>
        <button onClick={handleLogout} className="logout-button">
          로그아웃
        </button>
      </aside>

      <main className="repo-list-area">
        <h1 className="repo-title">프로젝트</h1>
        <ProjectForm onAdd={handleAddRepository} />
        <ul className="repo-list">
          {repositories.map((repo) => (
            <li className="repo-item" key={repo.name}>
              <div className="repo-top">
                <Link to={`/project/${repo.name}`} className="repo-name-link">
                  {repo.name}
                </Link>
                <span className={`perm-badge ${repo.permission}`}>
                  {repo.permission === "admin" ? "관리자" : "일반 사용자"}
                </span>
              </div>
              <div className="repo-meta">
                <span className="type-badge">
                  {repo.type === "docs" ? "📄 Docs" : "📊 PPT"}
                </span>
                <span>• {repo.updated}</span>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
