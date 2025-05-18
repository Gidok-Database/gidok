import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "@/components/Sidebar/Sidebar.css";

interface SidebarProps {
  pages: string[];
}

export default function Sidebar({ pages }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const scrollToPage = (index: number) => {
    const el = document.getElementById(`page-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <aside className={`left-panel ${collapsed ? "collapsed" : ""}`}>
        {!collapsed && (
          <div className="preview-thumbnails">
            <p className="preview-title">목차</p>
            {pages.map((content, i) => (
              <div
                key={i}
                className="thumbnail-wrapper"
                onClick={() => scrollToPage(i)}
              >
                <div className="thumbnail-box">
                  <div className="thumbnail-a4">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                  <span className="page-label">Page {i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      <button
        className={`collapse-toggle ${collapsed ? "collapsed" : ""}`}
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <span className="material-symbols-outlined">
          {collapsed ? "chevron_right" : "chevron_left"}
        </span>
      </button>
    </>
  );
}
