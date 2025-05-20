import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "@/pages/Login/Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = new URLSearchParams();
    data.append("username", form.username);
    data.append("password", form.password);

    axios.post("http://localhost:8000/api/user/login", data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      withCredentials: true, // ✅ 세션 쿠키 저장
    }).then((res)=> {
      alert(res.data.msg);
      navigate("/");
    }).catch((err) => {
      alert(err.response?.data?.detail || "로그인 실패");
    });
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <span className="material-symbols-outlined login-icon">account_circle</span>
        <h2>로그인</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="아이디"
            value={form.username}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={handleChange}
          />
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
