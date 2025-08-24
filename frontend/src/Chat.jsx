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
  <div className="chat-background">
    <div className="chat-container">

      {/* صندوق المستخدمين */}
      <div className="chat-sidebar">
        <h2>مرحبا، {username}!</h2>
        <label>حالتك:</label>
        <select
          value={currentStatus}
          onChange={(e) => {
            const newStatus = e.target.value;
            setCurrentStatus(newStatus);
            localStorage.setItem("currentStatus", newStatus);
            socket.emit("changeStatus", { userId: currentUserId, status: newStatus });
          }}
        >
          <option value="online">متصل</option>
          <option value="busy">مشغول</option>
          <option value="offline">غير متصل</option>
        </select>

        <h3>المستخدمون:</h3>
        {allUsers.filter(u => u._id !== currentUserId).map(user => (
          <div key={user._id} onClick={() => setSelectedUserId(user._id)}
               className={selectedUserId === user._id ? "selected-user" : ""}>
            {user.username} {user.status === "online" ? "✅" : user.status === "busy" ? "⏱️" : "❌"}
          </div>
        ))}
      </div>

      {/* صندوق المتصلين الآن */}
      <div className="chat-sidebar">
        <h3>المتصلون الآن:</h3>
        {allUsers.filter(u => u._id !== currentUserId && u.status === "online").map(user => (
          <div key={user._id} onClick={() => setSelectedUserId(user._id)}
               className={selectedUserId === user._id ? "selected-user" : ""}>
            ✅ {user.username}
          </div>
        ))}
      </div>

      {/* صندوق المحادثة */}
      <div className="chat-main">
        <h2>المحادثة</h2>
        <button onClick={handleLogout}>تسجيل الخروج</button>
        <h4>
          {selectedUserId
            ? `الدردشة مع: ${allUsers.find(u => u._id === selectedUserId)?.username || selectedUserId}`
            : "اختر مستخدمًا"}
        </h4>

        <div className="messages-container">
          {messages.map((msg, i) => {
            const fromId = msg.from._id || msg.from;
            const isMine = fromId === currentUserId;
            return (
              <div key={i} className={isMine ? "message mine" : "message"}>
                <strong>{isMine ? "أنا" : msg.fromName || "مستخدم"}:</strong> {msg.content}
              </div>
            );
          })}
          <div ref={chatEndRef}></div>
        </div>

        <div className="send-message">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالة..."
          />
          <button onClick={handleSend}>إرسال</button>
        </div>
      </div>
    </div>
  </div>
);


};

export default Chat;
