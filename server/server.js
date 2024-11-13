const WebSocket = require('ws');

// WebSocket サーバーをポート3001で作成
const wss = new WebSocket.Server({ port: 3001 });

const sample = {
    id: "user123",
    setting: {
        name: "JohnDoe",
        style: 1,
        color: {
            r: 255,
            g: 100,
            b: 50,
            a: 0.8
        },
        size: {
            height: 180,
            width: 75
        }
    },
    state: {
        isSelf: false,
        isInRange: false,
        isHolding: false,
        isWriting: false
    },
    position: {
        x: 2500,
        y: 2500
    },
    chatText: {
        current: "Hello, world!",
        previous: "Hi there!"
    }
}

// メッセージをタイプ別に保存するためのオブジェクト
let messageQueue = {
    logInOut: [],
    setting: [],
    position: [],
    chat: []
};

let count = 0;


wss.on('connection', (ws) => {
    // 接続時にクライアントにIDを割り当て
    console.log(`Client connected`);
    ws.id = count;

    ws.on('message', (message) => {
        if (Buffer.isBuffer(message)) {
            message = message.toString();
        }
        console.log(`Received: ${message}`);

        const messageJson = JSON.parse(message);
        
        if (messageJson.type === "logInOut") {
            //ここでDBをIDベースで検索
            //そもそも無い時、パスワードが違うときはともにfalseにしておく
            let isAccepted = true;
            const authenticatedMessageJson = {
                ...sample,
                id : messageJson.message.id
            };
            ws.id = messageJson.message.id;


            if (isAccepted) {
                //ユーザ情報
                ws.send(JSON.stringify({
                    type : "logInOut",
                    authenticated : true,
                    message : authenticatedMessageJson
                }));
                
                messageQueue.position.push(authenticatedMessageJson);
            } else {
                ws.send(JSON.stringify({
                    type : "logInOut",
                    authenticated : false
                }));
            }

        } 
        else if (messageJson.type === "position") {
            //DBにstateと位置情報を更新しに行く
            message = JSON.stringify(messageJson);

            const existingIndex = messageQueue.position.findIndex(item => item.id === messageJson.message.id);
            if (existingIndex !== -1) {
                messageQueue.position[existingIndex] = messageJson.message;
            } else {
                messageQueue.position.push(messageJson.message);
            }
        }
    });


    ws.on('close', () => {
        console.log('Client disconnected');
        ws.isConnected = 0;
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(`{"type": "disconnect", "id": ${ws.id}}`);
            }
        });
    });
});

// 定期的にメッセージをブロードキャスト
setInterval(() => {
    Object.keys(messageQueue).forEach(type => {
        if (messageQueue[type].length > 0) {
            const messagesToSend = messageQueue[type];
            
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN && client.id != 0) {
                    client.send(JSON.stringify({
                        type: type,
                        id : client.id,
                        messages: messagesToSend
                    }));
                }
            });
            
            messageQueue[type] = [];
            console.log(`Sent ${type} messages to all clients:`, messagesToSend);
        }
    });
}, 100); 
