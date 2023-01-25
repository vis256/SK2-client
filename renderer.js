const url = require('url');
const net = require('net');

var socketClient;

var refreshRoomsInterval;

function connect() {
    const ip = g('ip-input').value;
    const port = parseInt(g('port-input').value);

    console.log({ ip, port });

    socketClient = net.connect({ host: ip, port }, () => {
        console.log('connected to server!');
        cui('login-form', false);
        cui('connect-button', false);
        cui('disconnect-button', true);
        cui('rooms-container', true);
        loadRooms();

        refreshRoomsInterval = setInterval(loadRooms, 5000);
    });

    socketClient.setTimeout(10000);

    socketClient.on('data', (data) => {
        if (data !== undefined && data !== null) {
            const msg = data.toString();
            console.log("[RECV]", msg);
            parseReceivedMessage(msg);
        }
    });

    socketClient.on('end', () => {
        console.log('disconnected from server');
        cui('login-form', true);
        cui('connect-button', true);
        cui('disconnect-button', false);
        cui('rooms-container', false);
        currentRoomID = null;
        currentUserID = null;
        loadedRooms = [];
        isMusician = false;

        refreshRoomsInterval = undefined;
    });

    socketClient.on('error', () => {
        console.log('error from server');
        cui('login-form', true);
        cui('connect-button', true);
        cui('disconnect-button', false);
        cui('rooms-container', false);
        currentRoomID = null;
        currentUserID = null;
        loadedRooms = [];
        isMusician = false;
        socketClient.end()

        refreshRoomsInterval = undefined;
    })

    socketClient.on('timeout', () => {
        console.log('timeout from server');
        cui('login-form', true);
        cui('connect-button', true);
        cui('disconnect-button', false);
        cui('rooms-container', false);
        currentRoomID = null;
        currentUserID = null;
        loadedRooms = [];
        isMusician = false;

        socketClient.end();
        refreshRoomsInterval = undefined;
    })
}

function disconnect() {
    console.log("disconnecting");
    cui('login-form', true);
    cui('connect-button', true);
    cui('disconnect-button', false);
    cui('rooms-container', false);
    socketClient.pause();
    socketClient.end();
}

function cui(part, state) {
    if (state) {
        g(part).classList.remove('disabled');
    } else {
        g(part).classList.add('disabled');
    }
}

var currentUserID = null;
var currentRoomID = null;
var loadedRooms = [];
var isMusician = false;

function loadRooms() {
    sendData("list|");
}

function buildRoomButtons(rooms) {
    const rl = g('room-list');
    x(rl);
    loadedRooms = [];

    for (const room of rooms) {
        if (room == '' || room == " ") continue;

        // ID USERCOUNT/MAXUSERCOUNT
        console.log({ room });
        const _e = room.split(' ');
        const _f = _e[1].split('/');

        const [id, userCount, maxuserCount] = [parseInt(_e), _f[0], _f[1]];
        loadedRooms.push({ id, userCount, maxuserCount });
    }

    for (const room of loadedRooms) {
        rl.appendChild(h(
            "div",
            { classList: ['room-entry'] },
            [
                h(
                    "h4",
                    { innerText: `#${room.id} ${room.userCount}/${room.maxuserCount}`, classList: ['room-data'] }
                ),
                h(
                    "button",
                    { innerText: "Join", onclick: joinRoom, _ROOM_ID: room.id, role: 'button' }
                ),
            ]
        ));

    }
}

function leaveRoom() {
    if (currentRoomID !== null) {
        sendData(`leave ${currentRoomID} ${currentUserID}`);
        currentRoomID = null;
        currentUserID = null;

        cui('rooms-container', true);
        cui('room-options', false);
        sendData("list|");
    }
}


function changeToMusician() {
    if (currentRoomID !== null) {
        sendData(`change role ${currentRoomID} ${currentUserID} M`);
        cui('musician-button', false);
        cui('listener-button', true);
        cui('piano', true);
    }
}

function changeToListener() {
    if (currentRoomID !== null) {
        sendData(`change role ${currentRoomID} ${currentUserID} L`);
        cui('musician-button', true);
        cui('listener-button', false);
        cui('piano', false);
    }
}

function joinRoom(id) {
    const rid = id.target._ROOM_ID;

    console.log("joining", rid);
    sendData(`join ${rid}`);

}

function createAndJoinRoom() {
    if (currentRoomID == undefined || currentRoomID == null) {
        sendData(`create|`)
    }
}

function joinCreatedRoom(params) {
    const a = params[0].split(" ");
    const roomId = parseInt(a[0]);
    const userId = parseInt(a[1]);
    currentUserID = userId;
    currentRoomID = roomId;
    cui('rooms-container', false);
    isMusician = true;
    connectPiano();
    cui('room-options', true);
    cui('musician-button', false);
    cui('listener-button', true);
    cui('piano', true);
    sendData("list|");
}

function onJoinRoom(params) {
    const a = params[0].split(" ");
    const roomId = parseInt(a[0]);
    const userId = parseInt(a[1]);
    currentUserID = userId;
    currentRoomID = roomId;
    cui('rooms-container', false);
    isMusician = false;
    connectPiano();
    cui('room-options', true);
    cui('musician-button', true);
    cui('listener-button', false);
    cui('piano', true);
    sendData("list|");
}

function onReceiveNote(params) {
    console.log({ params });
    const noteData = params.trim().split(" ").map(e => parseInt(e));
    console.log({ noteData });
}

onReceiveNote(" 147 147 147");

function parseReceivedMessage(message) {
    var messageParts = message.split('|');
    const params = messageParts.slice(1);
    console.log({ params });
    switch (messageParts[0]) {
        case "ROOMS":
            buildRoomButtons(params);
            break;

        case "JOINNEW":
            joinCreatedRoom(params);
            break;

        case "JOIN":
            onJoinRoom(params);
            break;

        // NOTE| 147 147 147
        case "NOTE":
            onReceiveNote(params);

        default:
            break;
    }
}

function sendData(message) {
    console.log("[SEND]", message);
    socketClient.write(`${message}\r\n`);
}

function sendNote(msg) {
    sendData(`NOTE|${currentRoomID} ${currentUserID} ${msg[0]} ${msg[1]} ${msg[2]}`)
}


// PIANO

JZZ.synth.Tiny.register();

var piano;

function connectPiano() {
    piano = JZZ.input.ASCII({
        A: 'F#4', Z: 'G4', S: 'G#4', X: 'A4', D: 'Bb4', C: 'B4', V: 'C5', G: 'C#5', B: 'D5',
        H: 'D#5', N: 'E5', M: 'F5', K: 'F#5', '<': 'G5', L: 'G#5', '>': 'A5', ':': 'Bb5'
    })
        .connect(JZZ.input.Kbd({ at: 'piano' })
            .connect(JZZ().openMidiOut())
            .connect(function (msg) {
                sendNote(msg)
            })
        );
}
