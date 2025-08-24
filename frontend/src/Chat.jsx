import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import "./styles/chat.css";

const Chat = () => {
  const navigate = useNavigate();

  //  المتغيرات
  const [socket, setSocket] = useState(null);
  const [token] = useState(localStorage.getItem("token"));
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentStatus, setCurrentStatus] = useState("offline");
  const [selectedUserId, setSelectedUserId] = useState(localStorage.getItem("selectedUserId") || "");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const chatEndRef = useRef(null);
 
  
const [username, setUsername] = useState(localStorage.getItem("username") || "");





  
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
  }, [token, navigate]);

  //  إنشاء socket مرّة وحدة + listeners
  useEffect(() => {
    if (!currentUserId) return;

    const s = io("http://localhost:5001");
    setSocket(s);

    // نخبر السيرفر إنو المستخدم صار أونلاين
    s.emit("userOnline", currentUserId);

    // تحديث قائمة الأونلاين
    s.on("updateOnlineUsers", (users) => {
      setOnlineUsers(users.filter((u) => u._id !== currentUserId));
      
    });

    // استقبال الرسائل الجديدة
    s.on("receiveMessage", (msg) => {
      const fromId = msg.from._id || msg.from;
      const toId = msg.to._id || msg.to;

      // نضيف الرسالة فقط إذا تخص المحادثة الحالية
      if (
        (fromId === selectedUserId && toId === currentUserId) ||
        (fromId === currentUserId && toId === selectedUserId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    // تنظيف عند الخروج أو إعادة تحميل
    return () => {
      s.off("updateOnlineUsers");
      s.off("receiveMessage");
      s.emit("logout", currentUserId);
      s.disconnect();
    };
  }, [currentUserId, selectedUserId]);

  //  جلب المستخدمين
 
useEffect(() => {
  if (!token)
     return;

  axios
    .get("http://localhost:5001/api/chat/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      if (Array.isArray(res.data)) setAllUsers(res.data);
      else if (Array.isArray(res.data.users)) setAllUsers(res.data.users);
      else setAllUsers([]);
    })
    .catch((err) => console.error("Error fetching users:", err));
}, [token]);



useEffect(() => {
  if (!socket || !currentUserId) return;

  socket.emit("userOnline", currentUserId);

  const handleStatusUpdate = (updatedUser) => {
    setAllUsers((prev) =>
      prev.map((u) => (u._id === updatedUser._id ? { ...u, status: updatedUser.status } : u))
    );
  };
 

  const handleOnlineUsers = (users) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        const onlineUser = users.find(o => o._id === u._id);
        return onlineUser ? { ...u, status: onlineUser.status } : u;
      })
    );
  };

  socket.on("updateUserStatus", handleStatusUpdate);
  socket.on("updateOnlineUsers", handleOnlineUsers);

  return () => {
    socket.off("updateUserStatus", handleStatusUpdate);
    socket.off("updateOnlineUsers", handleOnlineUsers);
  };
}, [socket, currentUserId]);


///////////////
useEffect(() => {
  const me = allUsers.find(u => u._id === currentUserId);

  if (me) {
    setCurrentStatus(me.status || "offline");
    localStorage.setItem("currentStatus", me.status || "offline");// تحديث آخر حالة
    
  
    setUsername(me.username);
  } else {
     const savedName = localStorage.getItem("username");
    const savedStatus = localStorage.getItem("currentStatus");
    if (savedStatus) setCurrentStatus(savedStatus);
  }
}, [allUsers, currentUserId]);



  
// جلب الرسائلل
useEffect(() => {
  const fetchMessages = async () => {
    if (!currentUserId || !selectedUserId || allUsers.length === 0) return;

    try {
      const res = await axios.get(
        `http://localhost:5001/api/chat/messages/${currentUserId}/${selectedUserId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const msgsWithName = (res.data || []).map((msg) => {
        const fromId = msg.from._id || msg.from;
        const fromUser = allUsers.find((u) => u._id === fromId);
        return { ...msg, fromName: fromUser ? fromUser.username : "انا" };
      });

      setMessages(msgsWithName);
    } catch (err) {
      console.error("خطأ في جلب الرسائل:", err);
    }
  };

  fetchMessages();
}, [currentUserId, selectedUserId, allUsers]);


  //  إرسال رسالة
  const handleSend = () => {
    if (!newMessage.trim()) return;
    if (!selectedUserId) {
      alert("اختر مستخدمًا أولاً");
      return;
    }

    const msg = {
      from: currentUserId,
      to: selectedUserId,
      content: newMessage,
    };

    socket.emit("sendMessage", msg);
    setNewMessage(""); 
  };

  //  تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("selectedUserId");
    localStorage.setItem("username",username); // بعد تسجيل الدخول

    if (socket) {
      socket.emit("logout", currentUserId);
      socket.disconnect();
    }
    navigate("/");
  };

 
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

 return (
  <div
    className="chat-background"
    style={{
      backgroundImage: "url('https://images.unsplash.com/photo-1754756356063-103a6019f346?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw2M3x8fGVufDB8fHx8fA%3D%3D')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <div style={{ display: "flex", width: "95%", height: "90%", backgroundColor: "rgba(255, 255, 255, 0.85)", borderRadius: "10px" }}>
      
      <div style={{ width: "250px", borderRight: "1px solid #ccc", padding: "10px" }}>
      <h2>مرحبا، {username}!</h2>





        <label>حالتك:</label>
        <select
          value={currentStatus}
          onChange={(e) => {
            const newStatus = e.target.value;
            setCurrentStatus(newStatus);
            localStorage.setItem("currentStatus", newStatus); // احفظ التغير
            socket.emit("changeStatus", { userId: currentUserId, status: newStatus });
          }}
        >
          <option value="online">متصل</option>
          <option value="busy">مشغول</option>
          <option value="offline">غير متصل</option>
        </select>

        <h3>المستخدمون:</h3>
        {allUsers
          .filter((u) => u._id !== currentUserId)
          .map((user) => (
            <div key={user._id} onClick={() => setSelectedUserId(user._id)}
              style={{ cursor: "pointer", fontWeight: selectedUserId === user._id ? "bold" : "normal", margin: "5px 0" }}>
              {user.username} {user.status === "online" ? "✅" : user.status === "busy" ? "⏱️" : "❌"}
            </div>
          ))}
      </div>

     
      <div style={{ width: "250px", borderRight: "1px solid #ccc", padding: "10px" }}>
        <h3>المتصلون الآن:</h3>
        {allUsers
          .filter(u => u._id !== currentUserId && u.status === "online")
          .map(user => (
            <div key={user._id} onClick={() => setSelectedUserId(user._id)}
              style={{ cursor: "pointer", fontWeight: selectedUserId === user._id ? "bold" : "normal", margin: "5px 0" }}>
              ✅ {user.username}
            </div>
          ))}
      </div>

    
      <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column" }}>
        <h2>المحادثة</h2>
        <button onClick={handleLogout}>تسجيل الخروج</button>

        <h4>
          {selectedUserId
            ? `الدردشة مع: ${allUsers.find((u) => u._id === selectedUserId)?.username || selectedUserId}`
            : "اختر مستخدمًا"}
        </h4>

        <div
          style={{
            border: "1px solid #ccc",
            flex: 1,
            overflowY: "scroll",
            marginBottom: "10px",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {messages.map((msg, i) => {
            const fromId = msg.from._id || msg.from;
            const isMine = fromId === currentUserId;

            return (
              <div
                key={i}
                style={{
                  alignSelf: isMine ? "flex-end" : "flex-start",
                  backgroundColor: isMine ? "#dcf8c6" : "#fff",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  margin: "5px 0",
                  maxWidth: "70%",
                  wordBreak: "break-word",
                }}
              >
                <strong>{isMine ? "أنا" : msg.fromName || "مستخدم"}:</strong> {msg.content}
              </div>
            );
          })}
          <div ref={chatEndRef}></div>
        </div>

        <div style={{ display: "flex", marginTop: "10px" }}>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالة..."
            style={{ flex: 1, marginRight: "5px", padding: "8px", borderRadius: "5px", border: "1px solid #aaa" }}
          />
          <button onClick={handleSend} style={{ padding: "10px", borderRadius: "5px", backgroundColor: "#4caf50", color: "white", border: "none" }}>إرسال</button>
        </div>
      </div>
    </div>
  </div>
);

};

export default Chat;
