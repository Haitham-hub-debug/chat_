import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";



//const socket = io("http://localhost:5001"); 

const Chat = () => {
  const navigate = useNavigate();


   const [socket, setSocket] = useState(null);


  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentUserId, setCurrentUserId] = useState("");


   const [currentStatus, setCurrentStatus] = useState("offline");
  // استرجاع selectedUserId من localStorage
  const [selectedUserId, setSelectedUserId] = useState(localStorage.getItem("selectedUserId") || "");
  
  const [onlineUsers, setOnlineUsers] = useState([]);
   const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [allUsers, setAllUsers] = useState([]);


     const chatEndRef = useRef(null); // هنا عرفنا الـ ref
 



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
  // إنشاء الـ socket وتسجيل المستخدم كمتصل
  useEffect(() => {
    if (!currentUserId) return;

    const s = io("http://localhost:5001");
    setSocket(s);

    s.emit("userOnline", currentUserId);

    s.on("updateOnlineUsers", (users) => {
      setOnlineUsers(users.filter(u => u._id !== currentUserId));
     
      setAllUsers(users);  // ← هذا هو التعديل الأهم
       

    });

    s.on("receiveMessage", (msg) => {
      const fromId = msg.from._id || msg.from;
      const toId = msg.to._id || msg.to;

      if ((fromId === selectedUserId && toId === currentUserId) || 
          (fromId === currentUserId && toId === selectedUserId)) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      // عند ترك الصفحة أو تحديثها، نسجل خروج المستخدم ونغلق الاتصال
      s.emit("logout", currentUserId);
      s.disconnect();
    };
  }, [currentUserId, selectedUserId]);

  // جلب كل المستخدمين
  useEffect(() => {
    if (!token) return;

    axios
      .get("http://localhost:5001/api/chat/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setAllUsers(res.data);
        } else if (Array.isArray(res.data.users)) {
          setAllUsers(res.data.users);
        } else {
          setAllUsers([]);
        }
      })
      .catch((err) => console.error("خطأ في جلب المستخدمين:", err));
  }, [token]);


    /////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
  const me = allUsers.find(u => u._id === currentUserId);
  if (me) setCurrentStatus(me.status || "offline");
}, [allUsers, currentUserId]);

  // جلب الرسائل عند تغيير المحادثة
useEffect(() => {
  const savedUserId = localStorage.getItem("selectedUserId");
  if (currentUserId && savedUserId) {
    setSelectedUserId(savedUserId); // إعادة تحميل آخر محادثة
    fetchMessages(savedUserId);
  }
}, [currentUserId]);

useEffect(() => {
  if (currentUserId && selectedUserId) {
    fetchMessages(selectedUserId);
    localStorage.setItem("selectedUserId", selectedUserId);
  } else {
    setMessages([]);
  }
}, [selectedUserId]);

  const fetchMessages = async (userId = selectedUserId) => {
  try {
    const res = await axios.get(
      `http://localhost:5001/api/chat/messages/${currentUserId}/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setMessages(res.data || []);
  } catch (err) {
    console.error("خطأ في جلب الرسائل:", err);
  }
};


  // إرسال رسالة بدون إضافة مكررة في الواجهة
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

    socket.emit("sendMessage", msg);
    setNewMessage("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("selectedUserId");
    socket.emit("logout", currentUserId);
socket.disconnect(); // يسكر الـ socket تماماً

    navigate("/");
  };




 
/////////

useEffect(() => {
  if (chatEndRef.current) {
    chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages]);

///////
   
  

   

  
  




  return (
    <div style={{ display: "flex", height: "100vh" }}>
  
  <div
    style={{
      width: "250px",
      borderRight: "1px solid #ccc",
      padding: "10px",
      boxSizing: "border-box",
    }}
  >
    <div style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
  <h2>مرحبا، {allUsers.find(u => u._id === currentUserId)?.username || "مستخدم"}!</h2>
</div>

    {/* هنا وضعنا تغيير الحالة بشكل منفصل */}
<div>
  <label>حالتك:</label>
  <select
  value={currentStatus}
  onChange={(e) => {
    const newStatus = e.target.value;
    setCurrentStatus(newStatus);
    socket.emit("changeStatus", { userId: currentUserId, status: newStatus });
  }}
>
  <option value="online">متصل</option>
  <option value="busy">مشغول</option>
  <option value="offline">غير متصل</option>
</select>
</div>
   <h3>المستخدمون:</h3>
{allUsers
  .filter(u => u._id !== currentUserId)
  .map(user => (
    <div
      key={user._id}
      onClick={() => {
        setSelectedUserId(user._id);
        localStorage.setItem("selectedUserId", user._id);
      }}
      style={{
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        margin: "5px 0",
        padding: "5px",
        borderBottom: "1px solid #ccc"
      }}
    >
      {/* اسم المستخدم */}
      <span style={{ fontWeight: "bold", fontSize: "14px" }}>
        {user.username || user.email || user._id}
      </span>

      {/* آخر ظهور */}
      <span style={{ fontSize: "12px", color: "gray" }}>
        {user.isOnline
          ? "متصل الآن ✅"
          : user.lastSeen
          ? `آخر ظهور: ${new Date(user.lastSeen).toLocaleString()}`
          : "غير متصل"}
      </span>
    </div>
  ))}





</div>


<div style={{ width: "250px", borderRight: "1px solid #ccc", padding: "10px" }}>
  <h3>المستخدمون المتصلون:</h3>
  {allUsers
    .filter(u => u._id !== currentUserId && u.status === "online") // المتصلون فقط
    .map(user => (
      <div
        key={user._id}
        onClick={() => {
          setSelectedUserId(user._id);
          localStorage.setItem("selectedUserId", user._id);
        }}
        style={{
          cursor: "pointer",
          margin: "5px 0",
          fontWeight: selectedUserId === user._id ? "bold" : "normal",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "green", // دائماً أخضر لأنه online
            display: "inline-block",
            marginRight: "8px",
          }}
        ></span>
        <span>{user.username}</span>
      </div>
    ))}

  {allUsers.filter(u => u._id !== currentUserId && u.status === "online").length === 0 && (
    <p>لا يوجد مستخدمون متصلون حالياً</p>
  )}
</div>


  {/* ===== Chat Area ===== */}
  <div style={{ flex: 1, padding: "20px" }}>
    <h2>مرحبا بك في الدردشة</h2>
    <button onClick={handleLogout}>تسجيل الخروج</button>

    <h4>
      {selectedUserId
        ? `الدردشة مع: ${
            allUsers.find((u) => u._id === selectedUserId)?.username ||
            selectedUserId
          }`
        : "اختر مستخدمًا لبدء الدردشة"}
    </h4>

    <div
      style={{
        border: "1px solid #ccc",
        height: "80%",
        overflowY: "scroll",
        marginBottom: "10px",
        padding: "5px",
      }}
    >
     {messages.map((msg) => (
  <div
    key={msg._id}
    style={{
      textAlign: msg.from === currentUserId ? "right" : "left",
      margin: "8px 0",
    }}
  >
    <div>
      <strong>{msg.from === currentUserId ? "أنا" : msg.fromName}:</strong>
    </div>
    <div>{msg.content}</div>
  </div>


      ))}
      <div ref={chatEndRef}></div>
    </div>

    <input
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      placeholder="اكتب رسالة..."
      style={{ width: "70%", marginRight: "5px" }}
    />
    <button onClick={handleSend}>إرسال</button>
  </div>
</div>




    );
};




    





export default Chat;
