import { useState } from "react";
import { Link } from "react-router-dom";
import ProjectForm from "@/components/ProjectForm/ProjectForm";
import "@/pages/Home/Home.css";

const userInfo = {
  name: "MinSup Kim",
  username: "kar7mp5",
  bio: "Computer Science Engineering, Inha University sophomore",
  location: "South Korea",
  followers: 34,
  following: 55,
  avatarUrl: "https://avatars.githubusercontent.com/u/00000000",
};

export default function Home() {
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

  return (
    <div className="github-page">
      <aside className="profile-sidebar">
        <img src={userInfo.avatarUrl} alt="avatar" className="avatar" />
        <h2>{userInfo.name}</h2>
        <p className="username">@{userInfo.username}</p>
        <p className="bio">{userInfo.bio}</p>
        <p className="location">📍 {userInfo.location}</p>
        <p className="follow">
          👥 {userInfo.followers} followers · {userInfo.following} following
        </p>
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
