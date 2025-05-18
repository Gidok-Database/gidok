// import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar/Sidebar";
import "@/pages/Home/Home.css";
import PagedMarkdown from "@/components/PagedMarkdown/PagedMarkdown";


const markdownPages = [
  `# 📝 프로젝트 개요\n\n- 이 시스템은 마크다운 문서를 렌더링합니다.\n- 페이지 단위로 나뉩니다.`,
  `## ⏱ 개발 일정\n\n1. 구조 설계\n2. 커밋 기능\n3. 렌더링\n4. 배포`,
  `## ⚙️ 기술 스택\n\n- React\n- TypeScript\n- FastAPI\n- PostgreSQL`,
  `## ⚙️ 기술 스택\n\n- React\n- TypeScript\n- FastAPI\n- PostgreSQL`,
  `## ⚙️ 기술 스택\n\n- React\n- TypeScript\n- FastAPI\n- PostgreSQL`,
  `## ⚙️ 기술 스택\n\n- React\n- TypeScript\n- FastAPI\n- PostgreSQL`
];

export default function Home() {
  return (
    <div className="layout-container">
      <header className="top-nav">
        <div className="nav-left">
          <span className="material-symbols-outlined">description</span>
        </div>
        <div className="nav-right">
          <span className="material-symbols-outlined">notifications</span>
        </div>
      </header>
      <div className="body-container">
        <Sidebar pages={markdownPages} />
        <main className="main-content preview-mode">
          <div className="document-preview">
            <PagedMarkdown pages={markdownPages} />
          </div>
        </main>
      </div>
    </div>
  );
}