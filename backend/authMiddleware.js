const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Authorization: Bearer TOKEN

  if (!token) return res.status(401).json({ message: "غير مصرح" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "التوكن غير صالح" });
    req.user = user; // تضيف بيانات المستخدم إلى الطلب
    next();
  });
}

module.exports = verifyToken;
