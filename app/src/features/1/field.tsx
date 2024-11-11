"use client";

import styles from "../../styles/common.module.css";
import User from "./user";
import { useState, useEffect, useRef } from "react";
import { useWebSocket } from './websocket';



export default function Field() {
    //////////////////////////////////////////////////////////////////////////////////////////////
    //mainUSer用の処理
    //////////////////////////////////////////////////////////////////////////////////////////////
    const [mainUser, setMainUser] = useState({
        id: "",
        backgroundColor: {
            r: 256,
            g: 256,
            b: 200,
            a: 256,
        },
        name:"",
        isSelf: true,
        isClose: false,
        isHolding: false,
        isWriting: false,
        currentChat: "",
        previousChat: "",
    });
    const [position, setPosition] = useState({
        x: 0,
        y: 0
    });
    const positionRef = useRef(position);
    useEffect(() => {
        positionRef.current = position;
    }, [position]);
    const handlePositionChange = (position: { x: number; y: number }) => {
        setPosition(position);
    };

    const scrollRef = useRef<HTMLDivElement>(null);
    const fieldRef = useRef<HTMLDivElement>(null);
    const [fieldPosition, setFieldPosition] = useState({
        left: 0,
        top: 0,
        scrollLeft: 0,
        scrollTop: 0,
        width: 0,
        height: 0,
    });

    //画面の情報を更新
    const updateFieldPosition = () => {
        if (fieldRef.current && scrollRef.current) {
            const rect = fieldRef.current.getBoundingClientRect();
            setFieldPosition({
                left: rect.left + scrollRef.current.scrollLeft,
                top: rect.top + scrollRef.current.scrollTop,
                scrollLeft: scrollRef.current.scrollLeft,
                scrollTop: scrollRef.current.scrollTop,
                width: rect.width,
                height: rect.height,
            });
        }
    };


    //画面スクロールとサイズ変更で画面の情報を更新関数を呼び出し
    useEffect(() => {
        updateFieldPosition();
        scrollRef.current?.addEventListener("scroll", updateFieldPosition);
        window.addEventListener("resize", updateFieldPosition);
        return () => {
            scrollRef.current?.removeEventListener("scroll", updateFieldPosition);
            window.removeEventListener("resize", updateFieldPosition);
        };
    }, []);


    //////////////////////////////////////////////////////////////////////////////////////////////
    //その他のユーザの処理，ユーザごとに状態を持たせることになりそう
    //////////////////////////////////////////////////////////////////////////////////////////////
    const { positionMessages, disconnectMessages } = useWebSocket();

    const [users, setUsers] = useState<any[]>([]);
    const [userMap, setUserMap] = useState<Map<any, any>>(new Map());


    //position更新時
    useEffect(() => {
        if (positionMessages.length > 0) {
            // positionMessagesの最後尾の要素を取得
            const latestMessage = positionMessages[positionMessages.length - 1];

            // 最後尾のメッセージ内のユーザー情報を元に users を更新
            latestMessage.messages
                .filter((message: any) => message.id !== latestMessage.id)
                .map((message: any) => {
                    let json = {
                        id: message.id,
                        backgroundColor: message.backgroundColor,
                        name: message.name,
                        position: message.position,
                        isSelf: false,
                        isHolding: false,
                        isWriting: false,
                        fieldPosition: null
                    };
                    if (userMap.get(json.id)) {
                        json = {
                            ...userMap.get(json.id),
                            ...json
                        }
                    } else {
                        json = {
                            ...json,
                            isClose: false,
                            currentChat: "",
                            previousChat: "",
                        };
                    }
                    userMap.set(json.id, { ...userMap.get(json.id), ...json });
                });

            // ユーザー情報をステートに設定
            setUserMap(userMap);
            setUsers(Array.from(userMap.values()));
        }
    }, [positionMessages]);


    //isCloseの更新
    const intervalId1 = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (intervalId1.current) {
            clearInterval(intervalId1.current);
        }

        intervalId1.current = setInterval(() => {
            Array.from(userMap.keys()).map(key => {
                let userData = userMap.get(key);
                //isCloseの計算
                if (Math.sqrt(Math.pow(positionRef.current.x - userData.position.x, 2) + Math.pow(positionRef.current.y - userData.position.y, 2)) < 400) {
                    userData = {
                        ...userData,
                        isClose: true,
                    };
                }else{
                    userData = {
                        ...userData,
                        isClose: false,
                    };
                }

                userMap.set(userData.id, userData);
            });
            // ユーザー情報をステートに設定
            setUserMap(userMap);
            setUsers(Array.from(userMap.values()));
        }, 50);

        return () => {
            if (intervalId1.current) {
                clearInterval(intervalId1.current);
            }
        };
    }, []);



    //disconnect時
    useEffect(() => {
        if (positionMessages.length > 0) {
            const latestMessage = disconnectMessages[disconnectMessages.length - 1];

            // 最後尾のメッセージ内のユーザー情報を元に users を更新
            if (userMap.get(latestMessage.id)) {
                userMap.delete(latestMessage.id);
            }

            setUsers(Array.from(userMap.values()));
        }
    }, [disconnectMessages]);


    return (
        <div ref={scrollRef} className={styles.backGround}>
            <div className={styles.fieldPadding1}>
                <div className={styles.fieldPadding2}>
                    <div ref={fieldRef} className={styles.field}>
                        <User {...mainUser} position={position} fieldPosition={fieldPosition} onPositionChange={handlePositionChange} />
                        {users.map((userData) => {
                            return (
                                <User key={userData.id} {...userData} fieldPosition={fieldPosition} onPositionChange={() => { }} />
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
