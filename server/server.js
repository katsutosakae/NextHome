const WebSocket = require('ws');

// WebSocket サーバーをポート3001で作成
const wss = new WebSocket.Server({ port: 3001 });

// メッセージをタイプ別に保存するためのオブジェクト
let messageQueue = {
    login: [],
    position: [],
    chat: []
};

let count = 0;

wss.on('connection', (ws) => {
    // 接続時にクライアントにIDを割り当て
    console.log(`Client connected`);
    ws.id = count++;

    ws.on('message', (message) => {
        // バッファを文字列に変換
        if (Buffer.isBuffer(message)) {
            message = message.toString();
        }
        console.log(`Received: ${message}`);

        const messageJson = JSON.parse(message);
        
        if (messageJson.type === "login") {
            ws.name = messageJson.name;
            ws.backgroundColor = messageJson.backgroundColor;
            ws.position = { x: 2500, y: 2500 };
            messageJson.id = ws.id;
            messageJson.password = null;
            message = JSON.stringify(messageJson);

            let isAccepted = true;
            if (isAccepted) {
                ws.send(`{"type": "login", "isConnected": true, "name" : "${ws.name}"}`);
                messageJson.type = "position";
                messageQueue.position.push(messageJson);
            } else {
                ws.send(`{"type": "login", "isConnected": false}`);
            }

        } 
        else if (messageJson.type === "position") {
            messageJson.id = ws.id;
            messageJson.name = ws.name;
            messageJson.backgroundColor = ws.backgroundColor;
            message = JSON.stringify(messageJson);

            const existingIndex = messageQueue.position.findIndex(item => item.id === messageJson.id);
            if (existingIndex !== -1) {
                messageQueue.position[existingIndex] = messageJson;
            } else {
                messageQueue.position.push(messageJson);
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
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: type,
                        id:client.id,
                        messages: messagesToSend
                    }));
                }
            });
            
            messageQueue[type] = [];
            console.log(`Sent ${type} messages to all clients:`, messagesToSend);
        }
    });
}, 100); 
