import React, { useEffect, useState } from "react";
import { getRooms } from "../api";

export default function RoomList({ token, setRoom }) {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    async function fetchRooms() {
      const res = await getRooms(token);
      setRooms(res.data);
    }
    fetchRooms();
  }, [token]);

  return (
    <div>
      <h2>Select a Room</h2>
      {rooms.map((room) => (
        <div key={room.id} onClick={() => setRoom(room)}>
          {room.name}
        </div>
      ))}
    </div>
  );
}