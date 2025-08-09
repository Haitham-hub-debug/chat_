const express = require("express");
const router = express.Router();
const verifyToken = require("../authMiddleware");

router.get("/protected-route", verifyToken, (req, res) => {
  res.json({ message: "هذه بيانات محمية فقط للمستخدمين المسجلين", user: req.user });
});

module.exports = router;
