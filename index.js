import express from 'express';
import path from 'path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const io = new Server(server);
const PORT = 3000;

const __dirname = dirname(fileURLToPath(import.meta.url));

// Servir les fichiers statiques à partir du dossier `public`
app.use(express.static(path.join(__dirname, `public`)));

// Route pour rendre le fichier index.html
app.get(`/`, (req, res) => res.sendFile(join(__dirname, `index.html`)));

server.listen(PORT, () => console.log(`server running at http://localhost:${PORT}`));

let first = 0;
let users = [];

io.on(`connection`, (socket) => {
    console.log(`a user connected`);
    // socket.broadcast.emit(`hi`, `${socket.id} vient de se connecter`);

    if (users.length < 2) {
        users.push(socket.id);
        socket.emit(`player`, users.indexOf(socket.id));
    }

    socket.on(`disconnect`, () => {
        console.log(`user disconnected`);
        // socket.broadcast.emit(`deconnexion`, `${socket.id} vient de se déconnecter`);

        users = users.filter((user) => user !== socket.id);
    });

    socket.on(`create-game`, (callback) => {
        const gameID = uuidv4();
        socket.emit(`game-created`, gameID);
        callback(gameID);
    });

    socket.on(`message`, (msg) => {
        io.emit(`message`, msg);
    });

    socket.on("game", (msg) => {
        msg.player = users.indexOf(socket.id);
        if (first == msg.player) {
            if (first == 0) first = 1;
            else first = 0;
            msg.nextPlayer = first;
            io.emit("game", msg);
        }
    });
});