
import WebSocketRender from "../features/1/webSocketRender";
import styles from "../styles/common.module.css";
import React from "react";
import { useWebSocket, WebSocketProvider } from '../features/1/websocket';

export default function Home() {
  return (
    <WebSocketProvider>
      <WebSocketRender/>
      testjjavdo
    </WebSocketProvider>
  );
}
