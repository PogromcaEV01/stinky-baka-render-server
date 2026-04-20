const { PeerServer } = require('peer');
const port = process.env.PORT || 10000; // Render używa portu 10000 lub zmiennej PORT

const peerServer = PeerServer({ 
    port: port, 
    path: '/myapp',
    proxied: true 
});

console.log(`PeerServer działa na porcie ${port}`);
