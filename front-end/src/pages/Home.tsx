import Sidebar from "@/components/Sidebar";
import "@/pages/Home.css";

export default function Home() {
  return (
    <div className="layout-container">
      <header className="top-nav">
        <div className="nav-left">
          <div className="avatar" />
        </div>
        <div className="nav-right">
          <div className="icon" />
          <div className="profile" />
        </div>
      </header>
      <div className="body-container">
        <Sidebar />
        <main className="main-content">
          <div className="file-header">
            <select><option>main</option></select>
            <span>마지막 수정 2시간 전</span>
          </div>
          <div className="file-box">
            <p>회의록.md</p>
            <div className="file-content" />
          </div>
        </main>
      </div>
    </div>
  );
}
