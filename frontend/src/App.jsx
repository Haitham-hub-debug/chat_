import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import Chat from "./Chat";
import F_pass from "./F_pass";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} /> {/* يوجه مباشرة لصفحة تسجيل الدخول */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/forgot" element={<F_pass />} />
    </Routes>
  );
}

export default App;
