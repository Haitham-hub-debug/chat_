const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String }, // رابط الصورة

  isOnline: { type: Boolean, default: false }, // إذا المستخدم متصل الآن أم لا
  lastSeen: { type: Date, default: null },     // آخر ظهور للمستخدم

  // إضافة حقل الـ status
 status: { type: String, enum: ["online", "offline", "busy"], default: "offline" },

 
});

module.exports = mongoose.model("User", UserSchema);

