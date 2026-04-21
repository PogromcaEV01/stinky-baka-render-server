const { PeerServer } = require('peer');
const { createClient } = require('@supabase/supabase-js');

// 1. Inicjalizacja Supabase (klucze pobierane ze zmiennych środowiskowych Render)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const port = process.env.PORT || 10000; 

// 2. Uruchomienie PeerServer
const peerServer = PeerServer({ 
    port: port, 
    path: '/myapp',
    proxied: true 
});

console.log(`PeerServer działa na porcie ${port}`);

// 3. System zliczania graczy
let activePlayers = 0;

peerServer.on('connection', (client) => {
    activePlayers++;
    console.log(`[+] Gracz dołączył. Aktualnie online: ${activePlayers}`);
});

peerServer.on('disconnect', (client) => {
    activePlayers--;
    if (activePlayers < 0) activePlayers = 0; // Zabezpieczenie na wszelki wypadek
    console.log(`[-] Gracz wyszedł. Aktualnie online: ${activePlayers}`);
});

// 4. Wysyłanie statystyk do Supabase co 1 minutę (60000 ms)
setInterval(async () => {
    // Wysyłamy dane tylko, jeśli URL i Klucz zostały poprawnie ustawione
    if (supabaseUrl && supabaseKey) {
        console.log(`Wysyłam statystyki do bazy: ${activePlayers} graczy.`);
        
        const { error } = await supabase
            .from('server_stats') // Upewnij się, że masz tabelę o takiej nazwie w Supabase!
            .insert([
                { active_players: activePlayers, timestamp: new Date() }
            ]);

        if (error) {
            console.error('Błąd podczas zapisu do Supabase:', error);
        }
    } else {
        console.log(`(Symulacja) Aktualnie graczy: ${activePlayers}. Dodaj klucze Supabase na Renderze, aby zapisywać.`);
    }
}, 60000);
