import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/common.module.css";
import { useWebSocket } from './websocket';

type UserProps = {
    id: string;
    backgroundColor: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    name : string;
    isSelf: boolean;
    isClose: boolean;
    isHolding: boolean;
    isWriting: boolean;
    currentChat: string;
    previousChat: string;
    position: {
        x: number;
        y: number;
    }

    fieldPosition: {
        left: number;
        top: number;
        scrollLeft: number;
        scrollTop: number;
        width: number;
        height: number;
    };
    onPositionChange?: (position: { x: number; y: number }) => void;
};

export default function User(props: UserProps) {
    const userColor: React.CSSProperties = {
        backgroundColor: `rgba(${props.backgroundColor.r}, ${props.backgroundColor.g}, ${props.backgroundColor.b}, ${props.backgroundColor.a})`,
    };

    const { socket, sendMessage, loginMessages } = useWebSocket();


    //////////////////////////////////////////////////////////////////////////////////////////////
    //isSelfがTrueの時の処理
    //////////////////////////////////////////////////////////////////////////////////////////////

    //プレイヤー移動のためのパラメータ設定
    const position = useRef({
        mousePosX: 0,
        mousePosY: 0,
        offsetX: 0,
        offsetY: 0,
    });
    const userRef = useRef<HTMLDivElement>(null);
    const latestFieldPosition = useRef(props.fieldPosition);
    useEffect(() => {
        latestFieldPosition.current = props.fieldPosition;
    }, [props.fieldPosition]);
    const latestIsHolding = useRef(props.isHolding);


    if (props.isSelf) {
        //最初に一回だけやる処理はisSelfとかの一生変わらんやつが良いね
        useEffect(() => {
            if (props.isSelf && userRef.current) {
                // 初回マウント時のみ発動
                userRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        }, [props.isSelf]);

        // インターバル系の定義用
        // 全ての画面の更新に対してsetIntervalをリセットして，積み重ねを防ぐ
        const intervalId1 = useRef<NodeJS.Timeout | null>(null);
        const intervalId2 = useRef<NodeJS.Timeout | null>(null);
        useEffect(() => {
            if (intervalId1.current) {
                clearInterval(intervalId1.current);
            }
            if (intervalId2.current) {
                clearInterval(intervalId2.current);
            }


            //マウスが動いてないときも位置を更新
            //ただし，ホールド中でスクロールが追い付いてないときのみ
            intervalId1.current = setInterval(() => {
                if (latestIsHolding.current) {
                    calculateUserPos();
                }
                const userElement = userRef.current;
                props.onPositionChange({
                    x: Number(userElement?.style.left.split("px")[0] || 0),
                    y: Number(userElement?.style.top.split("px")[0] || 0)
                })
            }, 10);
            //WebSocketでサーバに位置情報を送信
            intervalId2.current = setInterval(() => {
                if (latestIsHolding.current && socket && socket.readyState === WebSocket.OPEN) {
                    const userElement = userRef.current;
                    //画面に送る情報
                    //ここは位置情報のみ送信，chatコンポーネントではチャット内容を送信，色変更では色のみ送信
                    sendMessage(JSON.stringify({
                        type: "position",
                        position: {
                            x: Number(userElement?.style.left.split("px")[0] || 0),
                            y: Number(userElement?.style.top.split("px")[0] || 0)
                        }
                    }));
                }
            }, 100)


            return () => {
                if (intervalId1.current) {
                    clearInterval(intervalId1.current);
                }
                if (intervalId2.current) {
                    clearInterval(intervalId2.current);
                }
            };
        }, []);



        //マウス操作に対するイベントを定義
        //ただし，ホールド中でスクロールが追い付いてないときのみ
        useEffect(() => {
            if (props.isSelf && userRef.current) {
                const userElement = userRef.current;

                const onMouseDown = (e: MouseEvent) => {
                    console.log(userElement?.style.left)
                    const rect = userElement.getBoundingClientRect();
                    position.current.mousePosX = e.clientX;
                    position.current.mousePosY = e.clientY;
                    position.current.offsetX = e.clientX - rect.left;
                    position.current.offsetY = e.clientY - rect.top;


                    latestIsHolding.current = true;

                    const onMouseMove = (moveEvent: MouseEvent) => {
                        position.current.mousePosX = moveEvent.clientX;
                        position.current.mousePosY = moveEvent.clientY;

                        calculateUserPos();
                    };

                    const onMouseUp = () => {
                        document.removeEventListener("mousemove", onMouseMove);
                        document.removeEventListener("mouseup", onMouseUp);
                        latestIsHolding.current = false;

                        //最後の位置は送っとく
                        sendMessage(JSON.stringify({
                            type: "position",
                            position: {
                                x: Number(userElement?.style.left.split("px")[0] || 0),
                                y: Number(userElement?.style.top.split("px")[0] || 0)
                            }
                        }));
                    };
                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                };

                userElement.addEventListener("mousedown", onMouseDown);

                // クリーンアップ
                return () => {
                    userElement.removeEventListener("mousedown", onMouseDown);
                };
            }
        }, [props.isSelf, props.fieldPosition]);
    }

    //初期位置なんかバグるから手動セッティング
    const latestName = useRef();
    useEffect(() => {
        if (loginMessages.length > 0) {
            const latestMessage = loginMessages[loginMessages.length - 1];
            if (latestMessage.isConnected) {
                const userElement = userRef.current;
                if (userElement) {
                    userElement.style.left = "2500px";
                    userElement.style.top = "2500px";
                }
                latestName.current = latestMessage.name;
            }
        }
    }, [props.isSelf, loginMessages]);


    // プレイヤーの座標移動処理
    const calculateUserPos = () => {
        const userElement = userRef.current;
        if (userElement) {
            let rect = userElement.getBoundingClientRect();
            const userSpeed = 0.08;
            const { left, top, scrollLeft, scrollTop, width, height } = latestFieldPosition.current;

            const mousePosX = position.current.mousePosX - position.current.offsetX - left + scrollLeft;
            const mousePosY = position.current.mousePosY - position.current.offsetY - top + scrollTop;
            const userElementPosX = Number(userElement.style.left.split("px")[0]);
            const userElementPosY = Number(userElement.style.top.split("px")[0]);

            let x = (mousePosX - userElementPosX) * userSpeed + userElementPosX;
            let y = (mousePosY - userElementPosY) * userSpeed + userElementPosY;

            // 画面外に出ないように設定
            x = x < 0 ? 0 : x > width - rect.width ? width - rect.width : x;
            y = y < 0 ? 0 : y > height - rect.height ? height - rect.height : y;

            userElement.style.left = `${x}px`;
            userElement.style.top = `${y}px`;

            // 親要素をスクロールさせる
            if (userElement.parentNode?.parentNode?.parentNode?.parentElement) {
                const horizontalDistance = (position.current.mousePosX - window.innerWidth / 2) / (window.innerWidth / 2);
                const verticalDistance = (position.current.mousePosY - window.innerHeight / 2) / (window.innerHeight / 2);
                const scrollSpeed = 15
                userElement.parentNode.parentNode.parentNode.parentElement.scroll({
                    left: (Math.abs(horizontalDistance) > 0.1 ? horizontalDistance : 0) * scrollSpeed + scrollLeft,
                    top: (Math.abs(verticalDistance) > 0.1 ? verticalDistance : 0) * scrollSpeed + scrollTop,
                });
            }
        }
    };



    //////////////////////////////////////////////////////////////////////////////////////////////
    //isSelfがFalseの時の処理
    //////////////////////////////////////////////////////////////////////////////////////////////
    //props越しに受けとった，座標情報を反映させるのみ
    if (!props.isSelf) {
        const latestPosition = useRef(props.position)
        useEffect(() => {
            const userElement = userRef.current;
            latestPosition.current = props.position;
        }, [props.position])


        // インターバル系の定義用
        // 全ての画面の更新に対してsetIntervalをリセットして，積み重ねを防ぐ
        const intervalId1 = useRef<NodeJS.Timeout | null>(null);
        useEffect(() => {
            if (intervalId1.current) {
                clearInterval(intervalId1.current);
            }

            intervalId1.current = setInterval(() => {
                const userElement = userRef.current;
                if (userElement) {
                    const userElementPosX = Number(userElement.style.left.split("px")[0]);
                    const userElementPosY = Number(userElement.style.top.split("px")[0]);
                    userElement.style.left = (0.3 * (latestPosition.current.x - userElementPosX) + userElementPosX) + "px";
                    userElement.style.top = (0.3 * (latestPosition.current.y - userElementPosY) + userElementPosY) + "px";
                };
            }, 50);

            return () => {
                if (intervalId1.current) {
                    clearInterval(intervalId1.current);
                }
            };
        }, []);

        
        useEffect(() => {
            if (loginMessages.length > 0) {
                const latestMessage = loginMessages[loginMessages.length - 1];
                if (latestMessage.isConnected) {
                    const userElement = userRef.current;
                    if (userElement) {
                        userElement.style.left = "2500px";
                        userElement.style.top = "2500px";
                    }
                }
            }
        }, [props.isSelf, loginMessages]);
    }


    return (
        <div
            ref={userRef}
            id={props.id}
            className={`${styles.user} ${props.isSelf ? styles.isSelf : ""} ${props.isHolding ? styles.isHolding : ""} ${props.isClose ? styles.isClose : ""}`}
            style={userColor}
        >
            <div className={styles.name}>
                {latestName.current}
            </div>
        </div>
    );
}
