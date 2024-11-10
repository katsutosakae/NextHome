"use client";

import styles from "../../styles/common.module.css";
import { useState, useEffect, useRef } from "react";
import { useWebSocket } from './websocket';



export default function Login() {
    const { socket, sendMessage, loginMessages } = useWebSocket();

    const [name, setName] = useState("Anonymous");
    const [password, setPassword] = useState("");
    const [color, setColor] = useState({
        r:Math.random()*256,
        g:Math.random()*256,
        b:Math.random()*256,
    });
    
    const handleLogin = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            const loginMessage = JSON.stringify({
                type: "login",
                name: name,
                password: password,
                backgroundColor: color,
                position : {
                    x:2500,
                    y:2500
                }
            });

            sendMessage(loginMessage); // ログインメッセージを送信
            console.log("Login message sent:", loginMessage);
        } else {
            console.error("WebSocket is not open");
        }
    };

    //ログイン成功したらこの要素をはけさせる
    const [isConnected, setIsConnected] = useState(false);
    useEffect(()=>{
        if(loginMessages.length > 0){
            const latestMessage = loginMessages[loginMessages.length - 1];
            if(latestMessage.isConnected){
                setIsConnected(true);
            }
        }
    },[loginMessages]);


    return (
        <div className={`${styles.login} ${isConnected ? styles.loginComplete : ""}`}>
            <p>
                name:<input className={styles.input} type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}></input>
            </p>
            <p>
                pass:<input className={styles.input} type="text" id="password" value={password} onChange={(e) => setPassword(e.target.value)}></input>
            </p>
            <p>
                color:
                <input className={styles.input} type="number" id="colorR" value={color.r} onChange={(e) => setColor((pre)=>({...pre, r:Number(e.target.value)}))}></input>
                <input className={styles.input} type="number" id="colorG" value={color.g} onChange={(e) => setColor((pre)=>({...pre, g:Number(e.target.value)}))}></input>
                <input className={styles.input} type="number" id="colorB" value={color.b} onChange={(e) => setColor((pre)=>({...pre, b:Number(e.target.value)}))}></input>
            </p>
            <button onClick={handleLogin}>Login</button>
        </div>
    );
}
