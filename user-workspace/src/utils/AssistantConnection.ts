import * as vscode from 'vscode';
import { Logger } from './Logger';
import { ConnectionState } from '../types/AssistantTypes';

export class AssistantConnection {
    private static instance: AssistantConnection;
    private state: ConnectionState = 'disconnected';
    private ws?: WebSocket;
    private readonly onMessage = new vscode.EventEmitter<string>();
    private webview?: vscode.Webview;
    
    private constructor() {}

    public static getInstance(): AssistantConnection {
        if (!AssistantConnection.instance) {
            AssistantConnection.instance = new AssistantConnection();
        }
        return AssistantConnection.instance;
    }

    public connect(url: string): void {
        this.state = 'connecting';
        try {
            this.ws = new WebSocket(url);
            
            this.ws.onopen = () => {
                this.state = 'connected';
                Logger.info('Assistant connection established');
                this.notifyStatusChange();
            };

            this.ws.onmessage = (event) => {
                this.onMessage.fire(event.data);
            };

            this.ws.onerror = () => {
                this.state = 'error';
                Logger.error('Connection error');
                this.notifyStatusChange();
            };

            this.ws.onclose = () => {
                this.state = 'disconnected';
                Logger.info('Connection closed');
                this.notifyStatusChange();
            };
        } catch (error: unknown) {
            this.state = 'error';
            Logger.error('Connection failed', error instanceof Error ? error : new Error(String(error)));
            this.notifyStatusChange();
        }
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = undefined;
        }
        this.state = 'disconnected';
        this.notifyStatusChange();
    }

    public sendMessage(message: string): void {
        if (this.state !== 'connected') {
            throw new Error('Not connected to assistant');
        }
        this.ws?.send(message);
    }

    public getState(): ConnectionState {
        return this.state;
    }

    public onReceiveMessage(callback: (message: string) => void) {
        return this.onMessage.event(callback);
    }

    public notifyStatusChange(): void {
        if (this.webview) {
            this.webview.postMessage({
                command: 'connectionStatus',
                status: this.state
            });
        }
    }
}