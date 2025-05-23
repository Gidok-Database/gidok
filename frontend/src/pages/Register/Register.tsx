import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "@/pages/Register/Register.css";

export default function Register() {
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL; 

  const [form, setForm] = useState({
    userid: "",
    password: "",
    password2: "",
    name: "",
    phone: "",
    email: "",
    org: "",
    desc: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.password2) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/user/signup`, form);
      alert("회원가입이 완료되었습니다.");
      navigate("/login");
    } catch (err: any) {
      alert(err.response?.data?.detail || "회원가입 실패");
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <span className="material-symbols-outlined register-icon">person_add</span>
        <h2>회원가입</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          <input type="text" placeholder="아이디" name="userid" value={form.userid} onChange={handleChange} />
          <input type="password" placeholder="비밀번호" name="password" value={form.password} onChange={handleChange} />
          <input type="password" placeholder="비밀번호 확인" name="password2" value={form.password2} onChange={handleChange} />
          <input type="text" placeholder="이름" name="name" value={form.name} onChange={handleChange} />
          <input type="text" placeholder="전화번호" name="phone" value={form.phone} onChange={handleChange} />
          <input type="email" placeholder="이메일" name="email" value={form.email} onChange={handleChange} />
          <input type="text" placeholder="소속" name="org" value={form.org} onChange={handleChange} />
          <input type="text" placeholder="설명 (선택)" name="desc" value={form.desc} onChange={handleChange} />
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
