import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import F_pass from "./F_pass";
import "./styles/login.css";


 

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showFPass, setShowFPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5001/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username)
      navigate("/chat");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "حدث خطأ");
    }
  };

  return (



     <div
      className="login-background"
      style={{
        backgroundImage: `url('https://png.pngtree.com/background/20230520/original/pngtree-3d-geometric-patterns-abstract-art-wallpapers-picture-image_2673760.jpg')`,
      }}
    >


    <div className="login-container">
      {!showFPass && (
        <>
          <form className="login-form" onSubmit={handleLogin}>
            <input
              className="login-input"
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="login-input"
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="login-btn" type="submit">تسجيل الدخول</button>
          </form>

          {error && <p className="login-error">{error}</p>}

          <button
            className="fpass-btn"
            onClick={() => setShowFPass(true)}
          >
            نسيت كلمة المرور؟
          </button>

          <p className="login-register">
            لا تملك حساب؟ <Link to="/register">سجل هنا</Link>
          </p>
        </>
      )}

      {showFPass && <F_pass />}
    </div>
    </div>
  );
}
