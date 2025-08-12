import React, { useEffect, useState } from "react";
import axios from "axios";

const RoomList = ({ token, onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRooms = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);
    } catch (err) {
      console.error("خطأ في جلب الغرف:", err);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return alert("أدخل اسم الغرفة");

    try {
      setLoading(true);
      await axios.post(
        "http://localhost:5000/api/rooms/create",
        {
          name: newRoomName,
          isPrivate,
          code: isPrivate ? roomCode : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewRoomName("");
      setRoomCode("");
      setIsPrivate(false);
      await fetchRooms();
    } catch (err) {
      alert("خطأ في إنشاء الغرفة");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>الغرف المتاحة</h3>
      <ul>
        {rooms.map((room) => (
          <li
            key={room._id}
            style={{ cursor: "pointer" }}
            onClick={() => onSelectRoom(room)}
          >
            {room.name} {room.isPrivate ? "(خاص)" : "(عام)"}
          </li>
        ))}
      </ul>

      <h4>إنشاء غرفة جديدة</h4>
      <input
        placeholder="اسم الغرفة"
        value={newRoomName}
        onChange={(e) => setNewRoomName(e.target.value)}
      />
      <label>
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
        />{" "}
        خاصة
      </label>
      {isPrivate && (
        <input
          placeholder="كود الدخول"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          type="password"
        />
      )}
      <button onClick={handleCreateRoom} disabled={loading}>
        {loading ? "جارٍ الإنشاء..." : "إنشاء"}
      </button>
    </div>
  );
};

export default RoomList;
