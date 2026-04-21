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

// 3. System zliczania graczy
let activePlayers = 0;

peerServer.on('connection', (client) => {
    activePlayers++;
    console.log(`[+] Gracz dołączył. Aktualnie online: ${activePlayers}`);
});

peerServer.on('disconnect', (client) => {
    activePlayers--;
    if (activePlayers < 0) activePlayers = 0; // Zabezpieczenie
    console.log(`[-] Gracz wyszedł. Aktualnie online: ${activePlayers}`);
});

// 4. Wysyłanie statystyk do Supabase co 1 minutę (60000 ms)
setInterval(async () => {
    if (supabase) {
        // NOWOŚĆ: Wysyłaj do bazy TYLKO jeśli jest chociaż 1 gracz na serwerze!
        if (activePlayers > 0) {
            console.log(`Wysyłam statystyki do bazy: ${activePlayers} graczy.`);
            
            const { error } = await supabase
                .from('server_stats') 
                .insert([
                    { active_players: activePlayers } 
                ]);

            if (error) {
                console.error('Błąd podczas zapisu do Supabase:', error.message);
            } else {
                console.log('Zapis do Supabase udany!');
            }
        } else {
            console.log('Serwer pusty (0 graczy) - pomijam zapis do bazy, aby oszczędzać miejsce.');
        }
    } else {
        console.log(`(Symulacja) Aktualnie graczy: ${activePlayers}. Oczekuję na klucze ENV.`);
    }
}, 60000);
