const { PeerServer } = require('peer');
const { createClient } = require('@supabase/supabase-js');

const port = process.env.PORT || 10000;

// 1. Pobieranie zmiennych środowiskowych z Rendera
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

// Bezpieczna inicjalizacja (serwer nie wybuchnie, jeśli brakuje kluczy)
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase zainicjowane poprawnie.");
} else {
    console.log("Brak kluczy Supabase. Działam w trybie offline/symulacji.");
}

// 2. Uruchomienie PeerServer
const peerServer = PeerServer({ 
    port: port, 
    path: '/myapp',
    proxied: true 
});

console.log(`PeerServer działa na porcie ${port}`);

// 3. System zliczania GRACZY i MECZÓW
let activeConnections = 0; // Wszyscy podłączeni (technicznie)
let activeMatches = 0;     // Tylko trwające gry (pokoje)

peerServer.on('connection', (client) => {
    activeConnections++;
    const id = client.getId(); // Pobieramy ID gracza
    
    // Jeśli ID zaczyna się od prefiksu pokoju, to znaczy, że ktoś założył grę!
    if (id.startsWith('trucizna_priv_') || id.startsWith('match_')) {
        activeMatches++;
        console.log(`[+] Rozpoczęto nową grę! Aktywne mecze: ${activeMatches}`);
    }
});

peerServer.on('disconnect', (client) => {
    activeConnections--;
    if (activeConnections < 0) activeConnections = 0;
    
    const id = client.getId();
    // Jeśli z serwera wychodzi Host, zamykamy mecz w statystykach
    if (id.startsWith('trucizna_priv_') || id.startsWith('match_')) {
        activeMatches--;
        if (activeMatches < 0) activeMatches = 0;
        console.log(`[-] Zakończono grę. Aktywne mecze: ${activeMatches}`);
    }
});

// 4. Wysyłanie statystyk do Supabase co 1 minutę
setInterval(async () => {
    if (supabase) {
        // Wysyłamy, jeśli gra toczy się chociaż 1 mecz
        if (activeMatches > 0) {
            // Skoro 1 mecz to 2 graczy, możemy zapisać to do bazy jako liczba graczy w grze!
            let playersInGame = activeMatches * 2; 
            
            console.log(`Wysyłam statystyki: ${activeMatches} meczów (${playersInGame} graczy).`);
            
            const { error } = await supabase
                .from('server_stats') 
                .insert([
                    { active_players: playersInGame } 
                ]);

            if (error) console.error('Błąd Supabase:', error.message);
        } else {
            console.log('Brak trwających meczów - pomijam zapis.');
        }
    }
}, 60000);
