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

  // ✅ 로그인 검증 및 프로젝트 목록 불러오기
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/user/me", {
        withCredentials: true,
      })
      .then((res) => {
        setUserInfo({
          name: res.data.name,
          userid: res.data.userid,
          avatarUrl: res.data.avatarUrl || userInfoDefault.avatarUrl,
        });
        return axios.get(`http://localhost:8000/api/project/search?userid=${res.data.userid}&role=admin`);
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

  const handleAddRepository = async (newRepo: ProjectType) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/project",
        {
          name: newRepo.name,
          org: "기본 소속",
          desc: "설명 없음",
        },
        {
          withCredentials: true,
        }
      );
      if (response.data?.project_id) {
        setRepositories((prev) => [newRepo, ...prev]);
      } else {
        alert("프로젝트 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("프로젝트 생성 오류:", error);
      alert("프로젝트 생성 중 오류가 발생했습니다.");
    }
  };

  if (loading) return null;

  return (
    <div className="github-page">
      <aside className="profile-sidebar">
        <img src={userInfo.avatarUrl} alt="avatar" className="avatar" />
        <h2>{userInfo.name}</h2>
        <p className="username">@{userInfo.userid}</p>
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
