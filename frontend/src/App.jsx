import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import Chat from "./Chat";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} /> {/* يوجه مباشرة لصفحة تسجيل الدخول */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/chat" element={<Chat />} />
    </Routes>
  );
}

export default App;
