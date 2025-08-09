// Chat.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const Chat = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentUserId, setCurrentUserId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [allUsers, setAllUsers] = useState([]);

  // فك التوكن للحصول على الـ userId
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.id || payload.userId);
    } catch (err) {
      console.error("خطأ في التوكن:", err);
      navigate("/");
    }
  }, [token]);

  // تسجيل المستخدم كمتصل واستقبال الرسائل والمستخدمين الأونلاين
  useEffect(() => {
    if (!currentUserId) return;

    socket.emit("userOnline", currentUserId);

    socket.on("updateOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("receiveMessage", (msg) => {
      // إذا الرسالة لك أو من طرفك الحالي
      if (
        (msg.from === selectedUserId && msg.to === currentUserId) ||
        (msg.from === currentUserId && msg.to === selectedUserId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("updateOnlineUsers");
      socket.off("receiveMessage");
    };
  }, [currentUserId, selectedUserId]);

  // جلب كل المستخدمين
 // جلب المستخدمين مع التحقق من شكل البيانات
useEffect(() => {
  if (!token) return;

  axios
    .get("http://localhost:5000/api/chat/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      console.log("المستخدمون:", res.data);
      if (Array.isArray(res.data)) {
        setAllUsers(res.data);
      } else if (Array.isArray(res.data.users)) {
        setAllUsers(res.data.users);
      } else {
        setAllUsers([]); // فارغ إذا غير معروف الشكل
      }
    })
    .catch((err) => console.error("خطأ في جلب المستخدمين:", err));
}, [token]);

      

  // جلب الرسائل بين المستخدمين عند تغيير المحادثة
  useEffect(() => {
    if (currentUserId && selectedUserId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [currentUserId, selectedUserId]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/chat/messages/${currentUserId}/${selectedUserId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(res.data || []);
    } catch (err) {
      console.error("خطأ في جلب الرسائل:", err);
    }
  };

  // إرسال رسالة
  const handleSend = () => {
    if (!newMessage.trim()) return;

    if (!selectedUserId) {
      alert("اختر مستخدمًا للدردشة قبل إرسال رسالة");
      return;
    }

    const msg = {
      from: currentUserId,
      to: selectedUserId,
      content: newMessage,
    };

    // أضف الرسالة مباشرة عندك
    setMessages((prev) => [...prev, msg]);

    // أرسلها للطرف الآخر عبر Socket.io
    socket.emit("sendMessage", msg);

    // فرغ خانة الكتابة
    setNewMessage("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>مرحبا بك في الدردشة</h2>
      <button onClick={handleLogout}>تسجيل الخروج</button>

      <h3>المستخدمون:</h3>
      {allUsers
        .filter((u) => u._id !== currentUserId)
        .map((user) => (
          <div
            key={user._id}
            onClick={() => setSelectedUserId(user._id)}
            style={{
              cursor: "pointer",
              fontWeight: selectedUserId === user._id ? "bold" : "normal",
              color: onlineUsers.includes(user._id) ? "green" : "gray",
            }}
          >
            {user.username || user.email || user._id}
          </div>
        ))}

      <hr />
      

      <h4>
        {selectedUserId
          ? `الدردشة مع: ${allUsers.find((u) => u._id === selectedUserId)?.username || selectedUserId}`
          : "اختر مستخدمًا لبدء الدردشة"}
      </h4>
      <div
        style={{
          border: "1px solid #ccc",
          height: "300px",
          overflowY: "scroll",
          marginBottom: "10px",
          padding: "5px",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              textAlign: msg.from === currentUserId ? "right" : "left",
              margin: "5px 0",
            }}
          >
            <strong>{msg.from === currentUserId ? "أنا" : "هو"}:</strong>{" "}
            {msg.content}
          </div>
        ))}
      </div>

      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="اكتب رسالة..."
        style={{ width: "70%", marginRight: "5px" }}
      />
      <button onClick={handleSend}>إرسال</button>
    </div>
  );
};

export default Chat;
