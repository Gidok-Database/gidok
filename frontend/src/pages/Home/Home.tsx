import Sidebar from "@/components/Sidebar/Sidebar";
import MarkdownRenderer from "@/components/MarkdownRenderer/MarkdownRenderer";
import "@/pages/Home/Home.css";


const markdown = `
## 프로젝트 개요

본 프로젝트는 웹 기반 문서 관리 시스템입니다. 사용자는 로그인 후 다양한 마크다운 형식의 문서를 작성하고, 시각적으로 렌더링된 형태로 열람할 수 있습니다. 이 시스템은 관리자 페이지를 통해 사용자 및 문서 권한을 관리할 수 있습니다.

---

### 핵심 기능

- 사용자 인증 및 세션 관리
- 마크다운 에디터 및 뷰어 통합
- 반응형 레이아웃 지원
- 관리자 전용 대시보드

---

### 개발 일정

1. **1주차**: \`프로젝트 구조 설계\` 및 기술 스택 결정
2. **2주차**: 로그인 / 회원가입 구현, DB 연동
3. **3주차**: 마크다운 렌더링 기능 개발
4. **4주차**: 관리자 페이지 개발 및 테스트
5. **5주차**: UI 개선 및 배포 준비

---

### 기술 스택

- **Frontend**: React, TypeScript, SCSS
- **Backend**: FastAPI, PostgreSQL
- **Authentication**: JWT 기반 인증 시스템
- **Deployment**: Vercel, Docker, GitHub Actions
`;


export default function Home() {
  return (
    <div className="layout-container">
      <header className="top-nav">
        <div className="nav-left">
          <span className="material-symbols-outlined">account_circle</span>
        </div>
        <div className="nav-right">
          <span className="material-symbols-outlined">notifications</span>
          <span className="material-symbols-outlined">account_circle</span>
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
            <p className="file-title">회의록.md</p>
            <div className="file-content">
              <MarkdownRenderer content={markdown} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
