import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import F_pass from "./F_pass";
export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      navigate("/chat");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "حدث خطأ");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="البريد الإلكتروني"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="كلمة المرور"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">تسجيل الدخول</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <p>
        لا تملك حساب؟ <Link to="/register">سجل هنا</Link>
      </p>
    </form>
  );
}
