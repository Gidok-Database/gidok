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
      .get("http://localhost:8000/api/user", {
        params: { user_id: undefined, user_name: undefined, user_email: undefined },
        withCredentials: true,
      })
      .then((res) => {
        const user = res.data[0];
        setUserInfo({
          name: user.name,
          userid: user.userid,
          email: user.email,
          org: user.organization,
          desc: user.description,
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
      .catch(() => {
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

  const handleAddRepository = (newRepo: ProjectType) => {
    setRepositories((prev) => [newRepo, ...prev]);
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
          {repositories.map((repo, i) => (
            <li className="repo-item" key={i}>
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
