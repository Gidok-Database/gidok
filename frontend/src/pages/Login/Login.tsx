import "@/pages/Login/Login.css";


export default function Login() {
  return (
    <div className="login-container">
      <div className="login-box">
        <span className="material-symbols-outlined login-icon">account_circle</span>
        <h2>로그인</h2>
        <form className="login-form">
          <input type="text" placeholder="아이디" />
          <input type="password" placeholder="비밀번호" />
          <button type="submit">로그인</button>
        </form>
        <div className="register-link">
          <span>계정이 없으신가요?</span>
          <a href="/register">회원가입</a>
        </div>
      </div>
    </div>
  );
}
