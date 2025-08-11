const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");



//zeit

function nachrichtenLoeschen() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // vor 24 Stunden

  Message.deleteMany({ createdAt: { $lt: oneDayAgo } })
    .then(result => {
      console.log(`Chat-Nachrichten wurden gelöscht: ${result.deletedCount}`);
    })
    .catch(err => {
      console.error("Fehler beim Löschen der Nachrichten:", err);
    });
}

// Alle 24 Stunden ausführen
setInterval(nachrichtenLoeschen, 24 * 60 * 60 * 1000);








// middleware لحماية المسارات
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// GET /api/chat/users
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select('-password');
    res.json({ users }); // حط users داخل object
  } catch (err) {
    console.error("فشل في جلب المستخدمين:", err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});
                                              router.get('/messages/:senderId/:receiverId', authenticateToken, async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    const messages = await Message.find({
      $or: [
        { from: senderId, to: receiverId },
        { from: receiverId, to: senderId }
        

      ]
    })
    .populate("from", "username")
    .populate("to", "username")
    .sort({ createdAt: 1 });
    console.log();

    res.json(messages);
  } catch (err) {
    console.error("خطأ في جلب الرسائل:", err);
    res.status(500).json({ error: 'Server error' });
  }
});


///////



                                              


module.exports = router;
