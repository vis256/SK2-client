const url = require('url');
const net = require('net');

var socketClient;

function onFormSubmit(e) {
    e.preventDefault();
}

function connect() {
    const ip = g('ip-input').value;
    const port = parseInt(g('port-input').value);

    console.log({ip, port});

    socketClient = net.connect({host:ip, port},  () => {
        console.log('connected to server!');
        g('login-form').classList.add('disabled');
        g('rooms-container').classList.remove('disabled');
        loadRooms();
    });

    socketClient.on('data', (data) => {
        if (data !== undefined && data !== null) {
            const msg = data.toString();
            console.log("[RECV]", msg);
            parseReceivedMessage(msg);
        }
    });

    socketClient.on('end', () => {
        console.log('disconnected from server');
    });
}

var currentRoomID = null;
var loadedRooms = [];
var isMusician = false;

function loadRooms() {
    sendData("list|");
}

function buildRoomButtons(rooms) {
    const rl = g('room-list');
    x(rl);

    for (const room of rooms) {
        // ID USERCOUNT/MAXUSERCOUNT
        console.log({room});
        const _e = room.split(' ');
        const _f = _e[1].split('/');
        
        const [id, userCount, maxuserCount] = [parseInt(_e), _f[0], _f[1]];
        loadedRooms.push({id, userCount, maxuserCount});
    }

    for (const room of loadedRooms) {
        rl.appendChild( h(
            "div",
            { classList : ['room-entry'] },
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

function test() {
    buildRoomButtons([
        '1 0/16',
        '2 1/16',
        '3 16/16',
        '3 16/16',
        '3 16/16',
        '3 16/16',
        '3 16/16',
        '3 16/16',
        '3 16/16',
        '3 16/16',
        '3 16/16',
        '3 16/16',
        '3 16/16',
        '3 16/16',
        '3 16/16',
        '3 16/16',
    ])

}

test()

function changeToMusician() {
    if (currentRoomID) {
        sendData(`CHANGEROLE|${currentRoomID} m`);
    }
}

function changeToListener() {
    if (currentRoomID) {
        sendData(`CHANGEROLE|${currentRoomID} s`);
    }
}

function joinRoom(id) {
    const rid = id.target._ROOM_ID;

    console.log("joining", rid);  
    sendData(`JOIN|${rid}`);  
}

function createAndJoinRoom() {
    if (currentRoomID == undefined || currentRoomID == null) {
        console.log("creating and joining");
        sendData(`CREATE|`)
    }
}

function parseReceivedMessage(message) {
    var messageParts = message.split('|');
    const params = messageParts.slice(1);
    switch (messageParts[0]) {
        case "ROOMS":
            buildRoomButtons( params );
            break;
    
        case "JOIN":
            currentRoomID = params[0];
            connectPiano();
            
            break;

        default:
            break;
    }
}

function sendData(message) {
    console.log("[SEND]", message);
    socketClient.write(`${message}\r\n`);
}


// PIANO

JZZ.synth.Tiny.register();

var piano;

function connectPiano() {
    piano = JZZ.input.ASCII({
        A:'F#4', Z:'G4', S:'G#4', X:'A4', D:'Bb4', C:'B4', V:'C5', G:'C#5', B:'D5',
        H:'D#5', N:'E5', M:'F5', K:'F#5', '<':'G5', L:'G#5', '>':'A5', ':':'Bb5'
      }).connect(JZZ.input.Kbd({at:'piano'}).connect(JZZ().openMidiOut()));
}
