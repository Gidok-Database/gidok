import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import ProjectForm from "@/components/ProjectForm/ProjectForm";
import "@/pages/Home/Home.css";

const userInfoDefault = {
  name: "",
  userid: "",
  avatarUrl: "https://avatars.githubusercontent.com/u/00000000",
};

export default function Home() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(userInfoDefault);
  const [loading, setLoading] = useState(true);

  // ✅ 로그인 검증
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/user/me", {
        withCredentials: true,
      })
      .then((res) => {
        setUserInfo({
          name: res.data.name,
          userid: res.data.userid,
          avatarUrl: res.data.avatarUrl || "https://avatars.githubusercontent.com/u/00000000",
        });
      })
      .catch(() => {
        alert("로그인이 필요합니다.");
        navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // ✅ 로그아웃 함수
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

  const [repositories, setRepositories] = useState([
    {
      name: "Database_Team_Project",
      permission: "admin" as "admin" | "user",
      type: "docs" as "docs" | "ppt",
      updated: "Updated yesterday",
    },
    {
      name: "InhaGianHub",
      permission: "user",
      type: "ppt",
      updated: "Updated last week",
    },
    {
      name: "Blog",
      permission: "admin",
      type: "docs",
      updated: "Updated last month",
    },
  ]);

  const handleAddRepository = (newRepo: typeof repositories[number]) => {
    setRepositories((prev) => [newRepo, ...prev]);
  };

  if (loading) return null;

  return (
    <div className="github-page">
      <aside className="profile-sidebar">
        <img src={userInfo.avatarUrl} alt="avatar" className="avatar" />
        <h2>{userInfo.name}</h2>
        <p className="username">@{userInfo.userid}</p>
        {/* ✅ 로그아웃 버튼 */}
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
