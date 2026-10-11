import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { deleteNotification, receiveNotification } from "../services/api";

// Optional: URL of the webhook relay (server.js). When set, notifications are
// pushed over socket.io instead of being polled from GREEN-API.
const SOCKET_URL = process.env.REACT_APP_WEBHOOK_SOCKET_URL;

const EMPTY_QUEUE_DELAY_MS = 1000;
const ERROR_DELAY_MS = 5000;

/**
 * Single source of incoming GREEN-API notifications for the whole app.
 *
 * Polling mode (default): one loop calls ReceiveNotification, hands the body to
 * `onNotification`, then deletes it so the next one can be received. The loop
 * is cancelled with an AbortController when credentials change or the
 * component unmounts, so no request keeps running after logout.
 */
const useIncomingNotifications = (credentials, onNotification) => {
    const handlerRef = useRef(onNotification);

    useEffect(() => {
        handlerRef.current = onNotification;
    }, [onNotification]);

    const idInstance = credentials?.idInstance;
    const apiTokenInstance = credentials?.apiTokenInstance;

    useEffect(() => {
        if (!idInstance || !apiTokenInstance) return undefined;

        const dispatch = (body) => {
            try {
                handlerRef.current?.(body);
            } catch (error) {
                console.error("Error handling notification:", error);
            }
        };

        if (SOCKET_URL) {
            const socket = io(SOCKET_URL, { reconnectionAttempts: 5, reconnectionDelay: 1000 });
            socket.on("newMessage", dispatch);
            return () => socket.disconnect();
        }

        const controller = new AbortController();
        const { signal } = controller;

        const wait = (ms) =>
            new Promise((resolve) => {
                const timer = setTimeout(resolve, ms);
                signal.addEventListener("abort", () => {
                    clearTimeout(timer);
                    resolve();
                }, { once: true });
            });

        const poll = async () => {
            while (!signal.aborted) {
                try {
                    const notification = await receiveNotification(idInstance, apiTokenInstance, signal);
                    if (signal.aborted) break;

                    if (!notification) {
                        await wait(EMPTY_QUEUE_DELAY_MS);
                        continue;
                    }

                    dispatch(notification.body);
                    await deleteNotification(idInstance, apiTokenInstance, notification.receiptId, signal);
                } catch (error) {
                    if (signal.aborted) break;
                    console.error("Notification polling failed:", error.message || error);
                    await wait(ERROR_DELAY_MS);
                }
            }
        };

        poll();

        return () => controller.abort();
    }, [idInstance, apiTokenInstance]);
};

export default useIncomingNotifications;
