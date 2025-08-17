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
  console.log("🔌 مستخدم متصل:", socket.id);

  socket.on("userOnline", async (userId) => {
    onlineUsers[userId] = socket.id;

    const usersData = await User.find({ _id: { $in: Object.keys(onlineUsers) } })
                                .select("username email _id");
    io.emit("updateOnlineUsers", usersData);
  });

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

      if (onlineUsers[to]) {
        io.to(onlineUsers[to]).emit("receiveMessage", messageData);
      }

      if (onlineUsers[from]) {
        io.to(onlineUsers[from]).emit("receiveMessage", messageData);
      }

      console.log("✅ تم إرسال الرسالة:", messageData);
    } catch (err) {
      console.error("❌ خطأ في حفظ الرسالة:", err);
    }
  });

  // ✅ حدث الخروج (disconnect) لازم يكون هون جوا connection
  socket.on("disconnect", async () => {
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }

    const usersData = await User.find({ _id: { $in: Object.keys(onlineUsers) } })
                                .select("username email _id");
    io.emit("updateOnlineUsers", usersData);

    console.log("❌ مستخدم انفصل:", socket.id);
  });
});




 



mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ تم الاتصال بقاعدة البيانات");
    server.listen(process.env.PORT || 5001, () =>
      console.log(`🚀 السيرفر يعمل على المنفذ ${process.env.PORT || 5001}`)
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
        user: process.env.GMAIL_USER, // بريدك
        pass: process.env.GMAIL_PASS, // كلمة مرور التطبيقات
          
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

