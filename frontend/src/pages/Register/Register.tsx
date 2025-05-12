import "@/pages/Register/Register.css";


export default function Register() {
  return (
    <div className="register-container">
      <div className="register-box">
        <span className="material-symbols-outlined register-icon">person_add</span>
        <h2>회원가입</h2>
        <form className="register-form">
          <input type="text" placeholder="아이디" />
          <input type="email" placeholder="이메일" />
          <input type="password" placeholder="비밀번호" />
          <input type="password" placeholder="비밀번호 확인" />
          <button type="submit">가입하기</button>
        </form>
        <div className="login-link">
          <span>이미 계정이 있으신가요?</span>
          <a href="/login">로그인</a>
        </div>
      </div>
    </div>
  );
}
