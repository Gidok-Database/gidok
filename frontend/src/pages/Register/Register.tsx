import "@/pages/Register/Register.css";


export default function Register() {
  return (
    <div className="register-container">
      <div className="register-box">
        <span className="material-symbols-outlined register-icon">person_add</span>
        <h2>회원가입</h2>
        <form className="register-form">
          <input type="text" placeholder="이름" name="name" />
          <input type="text" placeholder="아이디" name="userid" />
          <input type="password" placeholder="비밀번호" name="password" />
          <input type="text" placeholder="전화번호" name="phone" />
          <input type="email" placeholder="이메일" name="email" />
          <input type="text" placeholder="소속" name="organization" />
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
