import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import ProjectForm from "@/components/ProjectForm/ProjectForm";
import "@/pages/Home/Home.css";

interface ProjectType {
  id: number;
  name: string;
  org?: string;
  desc?: string;
  type: "docs" | "ppt";
  updated: string;
}

const userInfoDefault = {
  name: "",
  userid: "",
  email: "",
  org: "",
  desc: "",
  avatarUrl: "https://avatars.githubusercontent.com/u/00000000",
};

export default function Home() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(userInfoDefault);
  const [loading, setLoading] = useState(true);
  const [repositories, setRepositories] = useState<ProjectType[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    axios.get("http://localhost:8000/api/user/me", {
      withCredentials: true,
    }).then((res) => {
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
    }).then((res) => {
      const fetchedRepos = res.data.map((proj: any) => ({
        id: proj.id,
        name: proj.name,
        org: proj.organization,
        desc: proj.description,
        type: "docs",
        updated: "알 수 없음",
      }));
      setRepositories(fetchedRepos);
    }).catch(() => {
      alert("로그인이 필요합니다.");
      navigate("/login");
    }).finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8000/api/user/logout", {}, {
        withCredentials: true,
      });
      alert("로그아웃 되었습니다.");
      navigate("/login");
    } catch (error) {
      alert("로그아웃 실패");
    }
  };

  const handleAddRepository = async (formData: { name: string; org?: string; desc?: string }) => {
    try {
      // 1. 프로젝트 생성
      const res = await axios.post("http://localhost:8000/api/project/", formData, {
        withCredentials: true,
      });
      const projectId = res.data?.project_id;

      if (!projectId) {
        alert("프로젝트 생성 실패");
        return;
      }

      // 2. 초기 커밋 생성 (mode는 여전히 local로 생성됨)
      const commitRes = await axios.post(`http://localhost:8000/api/commit/${projectId}`, {
        page: 1,
        docs: "# 새 문서 시작\n\n이곳에 내용을 작성하세요.",
        title: "초기 커밋",
        desc: "자동 생성",
        old_start: 0,
        old_end: 0,
      }, { withCredentials: true });

      const hash = commitRes.data?.hash;
      if (!hash) {
        alert("초기 커밋 생성 실패");
        return;
      }

      // 3. 커밋 develop 모드로 push
      const pushRes = await axios.patch(`http://localhost:8000/api/commit/${projectId}`, {
        cmd: "push",
        hash: hash,
      }, { withCredentials: true });

      // 3. 커밋 develop 모드로 merge
      const mergeRes = await axios.patch(`http://localhost:8000/api/commit/${projectId}`, {
        cmd: "merge",
        hash: hash,
      }, { withCredentials: true });

      console.log(mergeRes.data);
      console.log(pushRes.data);

      if (pushRes.data?.msg !== "커밋을 성공적으로 푸쉬했습니다.") {
        alert("커밋 develop 승격 실패: " + pushRes.data?.msg);
        return;
      }

      // 4. UI에 반영
      setRepositories((prev) => [
        {
          id: projectId,
          name: formData.name,
          org: formData.org,
          desc: formData.desc,
          type: "docs",
          updated: "방금 생성됨",
        },
        ...prev,
      ]);
    } catch (err) {
      console.error("[ERROR] 프로젝트 생성 또는 커밋 오류:", err);
      alert("프로젝트 생성 또는 초기 커밋 실패");
    }
  };

  const handleDeleteRepository = async (projectId: number) => {
    if (!window.confirm("정말로 삭제하시겠습니까?")) return;

    try {
      await axios.post("http://localhost:8000/api/project/delete", {
        project_id: projectId
      }, { withCredentials: true });

      setRepositories((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      alert("삭제 실패");
    }
  };

  const handleEditRepository = async (projectId: number, updatedData: { name?: string; org?: string; desc?: string }) => {
    try {
      await axios.post(`http://localhost:8000/api/project/${projectId}/edit`, updatedData, {
        withCredentials: true,
      });

      setRepositories((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, ...updatedData } : p
        )
      );
    } catch (err) {
      alert("수정 실패");
    }
  };

  const handleSearch = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/project/search?title=${searchKeyword}`, {
        withCredentials: true,
      });

      const filtered = res.data.map((proj: any) => ({
        id: proj.id,
        name: proj.name,
        org: proj.organization,
        desc: proj.description,
        type: "docs",
        updated: "검색 결과",
      }));
      setRepositories(filtered);
    } catch (err) {
      alert("검색 실패");
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
        <div className="search-box">
          <input
            type="text"
            placeholder="프로젝트 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <button onClick={handleSearch}>검색</button>
        </div>
        <ul className="repo-list">
          {repositories.map((repo) => (
            <li className="repo-item" key={repo.id}>
              <div className="repo-top">
                <Link to={`/project/${repo.name}`} className="repo-name-link">
                  {repo.name}
                </Link>
                <button onClick={() => handleDeleteRepository(repo.id)}>🗑</button>
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
