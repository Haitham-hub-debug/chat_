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


//gmail
const nodemailer = require("nodemailer");





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
let onlineUsers  = {};



io.on("connection", (socket) => {
  console.log("🔌user is onlin:", socket.id);

  socket.on("userOnline", async (userId) => {
    socket.userId = userId; // نخزن userId مباشرة
    onlineUsers[userId] = socket.id;

    await User.findByIdAndUpdate(userId, { isOnline: true ,status: "online" });

    const usersData = await User.find().select("username email _id isOnline status lastSeen");
    io.emit("updateOnlineUsers", usersData);
    console.log("✅ now is Online:", userId);
  });
          //////
          socket.on("changeStatus", async ({ userId, status }) => {
    await User.findByIdAndUpdate(userId, { status });
    //const usersData = await User.find({ _id: { $in: Object.keys(onlineUsers) } })
      //                         .select("username email _id isOnline status lastSeen");
      //io.emit("updateOnlineUsers", usersData);
      const usersData = await User.find().select("username email _id isOnline status lastSeen");
io.emit("updateOnlineUsers", usersData);

    // أرسل التحديث لبقية المستخدمين
  io.emit("statusChanged", { userId, status });
 });
          //////
  // إرسال رسالة
  socket.on("sendMessage", async ({ from, to, content }) => {
    try {
      const fromUser = await User.findById(from);

      const savedMessage = await Message.create({
        from,
        to,
        content,
      });

      const messageData = {
        _id: savedMessage._id,
        from,
        fromName: fromUser ? fromUser.username : "غير معروف",
        to,
        content,
        createdAt: savedMessage.createdAt,
      };
      /////////
      
    // ابعت الرسالة للمستلم
    io.to(onlineUsers[to]).emit("message", messageData);

    // وابعتها كمان للمرسل عشان تنعرض عنده
    io.to(onlineUsers[from]).emit("message", messageData);

  } catch (err) {
    console.error("Error sending message:", err);
  }
});
      ////////
      // إرسال الرسالة للطرفين إذا كانوا أونلاين
     

  // قطع الاتصال
 socket.on("logout", async (userId) => {
  delete onlineUsers[userId];
  await User.findByIdAndUpdate(userId, { isOnline: false, status: "offline", lastSeen: new Date() });

  const usersData = await User.find().select("username email _id isOnline status lastSeen");
  io.emit("updateOnlineUsers", usersData);
  console.log("🚪 User logged out:", userId);
});
   
  

 socket.on("disconnect", async () => {
  if (socket.userId) {
    delete onlineUsers[socket.userId];
    await User.findByIdAndUpdate(socket.userId, { isOnline: false, status: "offline", lastSeen: new Date() });
      console.log("❌ User has disconnected:", socket.userId);
    }

          

    ///
  });
});

 



mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ The database has been contacted");
    server.listen(process.env.PORT || 5001, () =>
      console.log(` The server is running on the port. ${process.env.PORT || 5001}`)
    );
  })
  .catch((err) => console.error("❌ خطأ في الاتصال:", err));



  //////f_pass
 app.post("/F_pass", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ messages: ["الرجاء إدخال البريد الإلكتروني"] });
  }

  try {
    // إعداد النقل باستخدام Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // 
        pass: process.env.GMAIL_PASS, // 
          
      },
      
    });
    console.log(process.env.GMAIL_USER, process.env.GMAIL_PASS);


    // إعداد البريد
    const mailOptions = {
      from: `"دعم الموقع" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "إعادة تعيين كلمة المرور",
      text: "اضغط الرابط لإعادة تعيين كلمة المرور: http://localhost:5173/reset-password",
    };

    // إرسال البريد
    await transporter.sendMail(mailOptions);

    res.json({ messages: ["تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك"] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ messages: ["حدث خطأ أثناء إرسال البريد"] });
  }
});

