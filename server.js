require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.PUBG_API_KEY; 
const PLATFORM = 'steam'; 
const config = {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Accept': 'application/vnd.api+json'
  }
};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/seasons', async (req, res) => {
    try {
        const urlSeasons = `https://api.pubg.com/shards/${PLATFORM}/seasons`;
        const respuesta = await axios.get(urlSeasons, config);
        
        const temporadasPC = respuesta.data.data
            .filter(season => season.id.includes('pc-'))
            .reverse(); 

        res.json(temporadasPC);
    } catch (error) {
        console.error('Error al cargar temporadas');
        res.status(500).json({ error: 'No se pudieron cargar las temporadas' });
    }
});

app.get('/api/stats/:nombreJugador/:seasonId', async (req, res) => {
  const playerName = req.params.nombreJugador; 
  const seasonId = req.params.seasonId;

  try {
    console.log(`Buscando a ${playerName} en la temporada: ${seasonId}`);
    
    const urlId = `https://api.pubg.com/shards/${PLATFORM}/players?filter[playerNames]=${playerName}`;
    const respuestaId = await axios.get(urlId, config);
    const accountId = respuestaId.data.data[0].id;

    const urlStats = `https://api.pubg.com/shards/${PLATFORM}/players/${accountId}/seasons/${seasonId}`;
    const respuestaStats = await axios.get(urlStats, config);
    const stats = respuestaStats.data.data.attributes.gameModeStats;

    let statsRankedSquadFpp = null;
    let statsRankedSquadTpp = null;
    
    if (seasonId !== 'lifetime') {
        try {
            const urlRanked = `https://api.pubg.com/shards/${PLATFORM}/players/${accountId}/seasons/${seasonId}/ranked`;
            const respuestaRanked = await axios.get(urlRanked, config);
            const rankedStats = respuestaRanked.data.data.attributes.rankedGameModeStats;
            statsRankedSquadFpp = rankedStats['squad-fpp'];
            statsRankedSquadTpp = rankedStats['squad'];
        } catch (e) {
            console.log(`El jugador no tiene stats de Ranked en la temporada ${seasonId}.`);
        }
    }
    res.json({
        fpp: { squad: stats['squad-fpp'], duo: stats['duo-fpp'], solo: stats['solo-fpp'] },
        tpp: { squad: stats['squad'], duo: stats['duo'], solo: stats['solo'] },
        ranked: { squadFpp: statsRankedSquadFpp, squadTpp: statsRankedSquadTpp }
    });

  } catch (error) {
    console.error('Error procesando jugador o no tiene datos en esa temporada.');
    res.status(404).json({ error: 'Jugador no encontrado o sin datos en esta temporada' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});