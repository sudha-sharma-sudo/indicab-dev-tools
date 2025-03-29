import * as vscode from 'vscode';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export class Logger {
    private static outputChannel: vscode.OutputChannel;
    private static logLevel: LogLevel = 'info';

    static initialize(context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('IndiCab Tools');
        context.subscriptions.push(this.outputChannel);
    }

    static setLogLevel(level: LogLevel) {
        this.logLevel = level;
    }

    static error(message: string, error?: Error) {
        if (this.shouldLog('error')) {
            this.log('ERROR', message, error);
        }
    }

    static warn(message: string) {
        if (this.shouldLog('warn')) {
            this.log('WARN', message);
        }
    }

    static info(message: string) {
        if (this.shouldLog('info')) {
            this.log('INFO', message);
        }
    }

    static debug(message: string) {
        if (this.shouldLog('debug')) {
            this.log('DEBUG', message);
        }
    }

    private static shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
        return levels.indexOf(level) <= levels.indexOf(this.logLevel);
    }

    private static log(level: string, message: string, error?: Error) {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] [${level}] ${message}`);
        
        if (error) {
            this.outputChannel.appendLine(error.stack || error.message);
        }
    }
}