require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

const API_KEY = process.env.PUBG_API_KEY;
const PLATFORM = 'steam'; 
const config = {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Accept': 'application/vnd.api+json'
  }
};

app.use(express.static('public'));

app.get('/api/stats/:nombreJugador', async (req, res) => {
  const playerName = req.params.nombreJugador; 

  try {
    console.log(`Petición recibida en la web buscando a: ${playerName}`);
    
    const urlId = `https://api.pubg.com/shards/${PLATFORM}/players?filter[playerNames]=${playerName}`;
    const respuestaId = await axios.get(urlId, config);
    const accountId = respuestaId.data.data[0].id;

    const urlStats = `https://api.pubg.com/shards/${PLATFORM}/players/${accountId}/seasons/lifetime`;
    const respuestaStats = await axios.get(urlStats, config);
    
    const statsSquadFpp = respuestaStats.data.data.attributes.gameModeStats['squad-fpp'];
    const statsDuoFpp = respuestaStats.data.data.attributes.gameModeStats['duo-fpp'];
    const statsSoloFpp = respuestaStats.data.data.attributes.gameModeStats['solo-fpp'];

    res.json({
        squad: statsSquadFpp,
        duo: statsDuoFpp,
        solo: statsSoloFpp
    });

  } catch (error) {
    console.error('Error al buscar jugador');
    res.status(404).json({ error: 'Jugador no encontrado' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Web corriendo en http://localhost:${PORT}`);
});