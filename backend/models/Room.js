// models/Room.js
const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },       // اسم الغرفة
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // صاحب الغرفة
  isPrivate: { type: Boolean, default: false }, // هل الغرفة خاصة (مغلقة) أو عامة
  code: { type: String },                        // رمز الدخول (لو خاصة)
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // أعضاء الغرفة
}, { timestamps: true });

module.exports = mongoose.model("Room", RoomSchema);
