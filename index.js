const { PeerServer } = require('peer');
const port = process.env.PORT || 9000;

const peerServer = PeerServer({ 
    port: port, 
    path: '/myapp',
    proxied: true // Ważne dla hostingu typu Render/Heroku
});

console.log(`Serwer PeerJS działa na porcie ${port}`);
