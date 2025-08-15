import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import F_pass from "./F_pass";



export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
const [showFPass, setShowFPass] = useState(false); // حالة لإظهار نموذج نسيت كلمة المرور

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
     <div>
      {!showFPass && (
     <>

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
            <br/>
            <br/>
            <button type="submit">تسجيل الدخول</button>
          </form>
           <br/>
           <br/>
          <button onClick={() => setShowFPass(true)}>
            نسيت كلمة المرور؟
          </button>

          <p>
            لا تملك حساب؟ <Link to="/register">سجل هنا</Link>
          </p>
        </>
      )}

      {showFPass && <F_pass />} {/* يظهر نموذج إعادة تعيين كلمة المرور */}
  </div>
  );
}
