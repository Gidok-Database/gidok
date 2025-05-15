import "@/components/Sidebar/Sidebar.css";


export default function Sidebar() {
  return (
    <aside className="left-panel">
      <div className="search-wrapper">
        <input type="text" className="search-box" placeholder="파일 검색..." />
        <span className="material-symbols-outlined search-icon">search</span>
      </div>
      <div className="recent-edits">
        <p>마지막 수정 2시간 전</p>
        <div className="edit-item">
          <div className="circle" />
          <div className="edit-content" />
          <span className="edit-time">2시간 전</span>
        </div>
        <div className="edit-item">
          <div className="circle" />
          <div className="edit-content" />
          <span className="edit-time">2시간 전</span>
        </div>
      </div>
    </aside>
  );
}
