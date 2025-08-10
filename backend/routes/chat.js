const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");



//zeit
function nachrichtenLoeschen() {
 setInterval(nachrichtenLoeschen, 23 * 60 * 60 * 1000);

Message.deleteMany({ createdAt: { $lt: oneMinuteAgo } })

    .then(result => {
      console.log(`Chat-Nachrichten wurden gelöscht: ${result.deletedCount}`);
      // Hier kannst du nur im Backend Log schreiben oder weitere Aktionen machen
    })
    .catch(err => {
      console.error("Fehler beim Löschen der Nachrichten:", err);
    });
}

setInterval(nachrichtenLoeschen, 23 * 60 * 60 * 1000);







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
                                                const { senderId, receiverId } = req.params;
                                                try {
                                                  const messages = await Message.find({
                                                    $or: [
                                                      { from: senderId, to: receiverId },
                                                      { from: receiverId, to: senderId }
                                                    ]
                                                  }).sort({ createdAt: 1 });

                                                  res.json(messages);
                                                } catch (err) {
                                                  console.error("خطأ في جلب الرسائل:", err);
                                                  res.status(500).json({ error: 'Server error' });
                                                }
                                              });


module.exports = router;
