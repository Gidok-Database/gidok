import { useState } from "react";
import AddRepositoryForm from "@/components/ProjectForm/ProjectForm";
import "@/pages/Lobby/Lobby.css";

const userInfo = {
  name: "MinSup Kim",
  username: "kar7mp5",
  bio: "Computer Science Engineering, Inha University sophomore",
  location: "South Korea",
  followers: 34,
  following: 55,
  avatarUrl: "https://avatars.githubusercontent.com/u/00000000", // 임시
};

export default function Lobby() {
  const [repositories, setRepositories] = useState([
    {
      name: "Database_Team_Project",
      permission: "admin" as "admin" | "user",
      language: "Python",
      license: "Apache 2.0",
      updated: "Updated yesterday",
    },
    {
      name: "InhaGianHub",
      permission: "user",
      language: "Python",
      license: "Apache 2.0",
      updated: "Updated last week",
    },
    {
      name: "Blog",
      permission: "admin",
      language: "Markdown",
      license: "MIT",
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
        <h1 className="repo-title">Repositories</h1>
        <AddRepositoryForm onAdd={handleAddRepository} />
        <ul className="repo-list">
          {repositories.map((repo, i) => (
            <li className="repo-item" key={i}>
              <div className="repo-top">
                <span className="repo-name">{repo.name}</span>
                <span className={`perm-badge ${repo.permission}`}>
                  {repo.permission === "admin" ? "관리자" : "일반 사용자"}
                </span>
              </div>
              <div className="repo-meta">
                <span>{repo.language}</span>
                <span>• {repo.license}</span>
                <span>• {repo.updated}</span>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
