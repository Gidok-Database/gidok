import "@/pages/Lobby/Lobby.css";

const repositories = [
  {
    name: "Database_Team_Project",
    private: true,
    language: "Python",
    license: "Apache License 2.0",
    updated: "Updated yesterday",
  },
  {
    name: "InhaGianHub",
    private: false,
    language: "Python",
    license: "Apache License 2.0",
    updated: "Updated last week",
  },
  {
    name: "FirebaseServerTest",
    private: false,
    language: "Python",
    license: "MIT License",
    updated: "Updated 2 weeks ago",
  },
  {
    name: "Blog",
    private: true,
    language: "Markdown",
    license: "MIT License",
    updated: "Updated last month",
  },
  {
    name: "SurvivalRL",
    private: false,
    language: "Python",
    license: "MIT License",
    updated: "Updated on Apr 11",
  },
];

export default function Lobby() {
  return (
    <div className="repo-page">
      <h1 className="title">Repositories</h1>
      <ul className="repo-list">
        {repositories.map((repo, idx) => (
          <li key={idx} className="repo-item">
            <div className="repo-header">
              <a href="#" className="repo-name">
                {repo.name}
              </a>
              {repo.private && <span className="badge">Private</span>}
            </div>
            <div className="repo-meta">
              <span>{repo.language}</span>
              <span>• {repo.license}</span>
              <span>• {repo.updated}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
