const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const Message = require("./models/Message");
const User = require("./models/User");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
//app.use("/api/chat", require("./routes/chat"));


// ================== Socket.io ==================
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("🔌 مستخدم متصل:", socket.id);

  // استقبال المعرف عند الاتصال
  socket.on("userOnline", (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit("updateOnlineUsers", Object.keys(onlineUsers));
  });
socket.on("sendMessage", async ({ from, to, content }) => {
  try {
    // نجيب اسم المستخدم اللي أرسل الرسالة
    const fromUser = await User.findById(from);

    const toSocketId = onlineUsers[to];

    // نجهز بيانات الرسالة مع اسم المرسل
    const messageData = { 
      from, 
      fromName: fromUser ? fromUser.username : "غير معروف", 
      to, 
      content 
    };

    // نرسل الرسالة للطرف الآخر
    if (toSocketId) {
      io.to(toSocketId).emit("receiveMessage", messageData);
    }

    // نرسل للطرف المرسل للتأكيد
    socket.emit("receiveMessage", messageData);

    // نحفظ الرسالة في قاعدة البيانات
    await Message.create({ from, to, content });
    console.log("✅ تم حفظ الرسالة:", messageData);
  } catch (err) {
    console.error("❌ خطأ في حفظ الرسالة:", err);
  }
});

  // قطع الاتصال
  socket.on("disconnect", () => {
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }
    io.emit("updateOnlineUsers", Object.keys(onlineUsers));
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ تم الاتصال بقاعدة البيانات");
    server.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 السيرفر يعمل على المنفذ ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error("❌ خطأ في الاتصال:", err));
