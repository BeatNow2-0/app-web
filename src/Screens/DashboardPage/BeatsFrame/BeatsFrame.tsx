import React, { useEffect, useState } from "react";
//import BeatItem from "../../../components/BeatItems/BeatItem";
import UserSingleton from "../../../Model/UserSingleton"; // Asegúrate de importar correctamente UserSingleton
import { buildApiUrl } from '../../../config/apiConfig';

interface Beat {
  img: string;
  title: string;
  genre: string;
  date: string;
}

const ListBeat: React.FC = () => {
  const [beats, setBeats] = useState<Beat[]>([]);

  useEffect(() => {
    async function fetchBeats() {
      try {
        const user = UserSingleton.getInstance();
        const username = user.getUsername();
        const response = await fetch(buildApiUrl(`/v1/api/users/posts/${username}`));
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setBeats(data);
      } catch (error) {
        console.error("Failed to fetch beats:", error);
      }
    }

    fetchBeats();
  }, []); // El array vacío [] asegura que este efecto se ejecute solo una vez después del primer renderizado

  return (
    <div>
      <h1>Beats List</h1>
    </div>
  );
}

export default ListBeat;
