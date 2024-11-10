"use client";

import Field from "./field";
import Login from "./login";
import styles from "../styles/common.module.css";
import React from "react";
import { useWebSocket, WebSocketProvider } from './websocket';



//ソケットが確立するまで描画を止めるためのコンポーネント
export default function WebSocketRender() {
  const { socket } = useWebSocket();
  return (
    <>
      {socket ? <Login /> : ''}
      {socket ? <Field /> : ''}
    </>
  );
}
