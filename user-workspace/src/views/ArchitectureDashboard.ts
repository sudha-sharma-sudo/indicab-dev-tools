import * as vscode from 'vscode';
import { Colors } from '../utils/DesignSystem';
import { JavaProjectStructure } from '../utils/JavaProjectParser';
import { JavaClass } from '../utils/JavaParser';
import { AssistantConnection } from '../utils/AssistantConnection';

export class ArchitectureDashboard {
    private readonly view: vscode.WebviewPanel;
    private currentGraphData: GraphData;
    private projectStructure: JavaProjectStructure;
    private readonly connection: AssistantConnection;
    private messageHistory: string[] = [];

    constructor(context: vscode.ExtensionContext, projectStructure: JavaProjectStructure) {
        this.projectStructure = projectStructure;
        this.connection = AssistantConnection.getInstance();
        this.view = vscode.window.createWebviewPanel(
            'architectureView',
            'Project Architecture',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );
        
        this.currentGraphData = this.parseProjectStructure(projectStructure);
        this.setupWebview();
        
        this.connection.onReceiveMessage((message) => {
            this.messageHistory.push(message);
            this.view.webview.postMessage({
                command: 'assistantMessage',
                content: message
            });
        });
    }

    private parseProjectStructure(project: JavaProjectStructure): GraphData {
        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        
        try {
            for (const pkg of project.packages) {
                for (const cls of pkg.classes) {
                    // Create node for each class
                    nodes.push({
                        id: cls.name,
                        label: cls.name,
                        type: cls.type,
                        color: this.getNodeColor(cls),
                        issues: cls.issues,
                        hasIssues: cls.issues && cls.issues.length > 0
                    });

                    // Add edges for dependencies
                    if (cls.dependencies) {
                        cls.dependencies.forEach(dep => {
                            edges.push({
                                source: cls.name,
                                target: dep,
                                type: 'DEPENDENCY'
                            });
                        });
                    }

                    // Add inheritance edges
                    if (cls.superClass) {
                        edges.push({
                            source: cls.name,
                            target: cls.superClass,
                            type: 'INHERITANCE'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing project structure:', error);
        }

        return { nodes, edges };
    }

    private getNodeColor(cls: JavaClass): string {
        if (cls.springComponent?.type === 'CONTROLLER') return Colors.springController;
        if (cls.springComponent?.type === 'SERVICE') return Colors.springService;
        if (cls.springComponent?.type === 'REPOSITORY') return Colors.springRepository;
        if (cls.hasIssues) return Colors.error;
        if (cls.isTest) return Colors.test;
        if (cls.type === 'INTERFACE') return Colors.interface;
        if (cls.type === 'ENUM') return Colors.secondaryLight;
        return Colors.class;
    }

    private setupWebview() {
        this.view.webview.html = this.getWebviewContent();
        
        this.view.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'nodeClick':
                    this.handleNodeClick(message.id);
                    break;
                case 'connect':
                    this.connection.connect(message.url || 'wss://assistant.example.com');
                    break;
                case 'disconnect':
                    this.connection.disconnect();
                    break;
                case 'sendMessage':
                    this.connection.sendMessage(message.content);
                    break;
            }
        });
    }

    private handleNodeClick(nodeId: string) {
        let classPath: string | undefined;
        
        for (const pkg of this.projectStructure.packages) {
            const foundClass = pkg.classes.find(cls => cls.name === nodeId);
            if (foundClass) {
                classPath = foundClass.path;
                break;
            }
        }

        if (classPath) {
            vscode.workspace.openTextDocument(classPath).then(doc => {
                vscode.window.showTextDocument(doc, {
                    preserveFocus: true,
                    preview: false,
                    viewColumn: vscode.ViewColumn.One
                });
            });
        }
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Architecture</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        /* Connection Status Bar */
        .status-bar {
            display: flex;
            align-items: center;
            padding: 6px 12px;
            background: var(--vscode-statusBar-background);
            color: var(--vscode-statusBar-foreground);
            font-size: 12px;
            border-bottom: 1px solid var(--vscode-statusBar-border);
        }
        
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-disconnected { background: var(--vscode-errorForeground); }
        .status-connecting { background: var(--vscode-editorWarning-foreground); }
        .status-connected { background: var(--vscode-gitDecoration-addedResourceForeground); }
        
        /* Message Panel */
        .message-panel {
            position: fixed;
            bottom: 0;
            right: 0;
            width: 300px;
            height: 200px;
            background: var(--vscode-sideBar-background);
            border-left: 1px solid var(--vscode-sideBar-border);
            padding: 8px;
            overflow-y: auto;
        }
        
        /* Clean CSS styles */
        body { margin: 0; padding: 0; overflow: hidden; }
        #graph { width: 100%; height: 100vh; }
        .node { stroke: #fff; stroke-width: 1.5px; cursor: pointer; }
        .link { stroke: #999; stroke-opacity: 0.6; }
        .node-text { font-size: 12px; font-weight: bold; pointer-events: none; }
        .tooltip {
            position: absolute;
            padding: 8px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            border-radius: 4px;
            pointer-events: none;
            font-size: 12px;
            max-width: 300px;
        }
    </style>
</head>
<body>
    <div id="graph"></div>
    <div class="tooltip" style="opacity:0"></div>
    
    <div class="status-bar">
        <div class="status-indicator status-disconnected" id="connection-status"></div>
        <span id="connection-text">Disconnected</span>
    </div>
    
    <div class="message-panel" id="message-panel"></div>
    <script>
        const vscode = acquireVsCodeApi();
        const data = ${JSON.stringify(this.currentGraphData)};
        const connection = {
            status: 'disconnected',
            connect: () => vscode.postMessage({ command: 'connect' }),
            disconnect: () => vscode.postMessage({ command: 'disconnect' }),
            sendMessage: (message) => vscode.postMessage({ 
                command: 'sendMessage', 
                content: message 
            })
        };
        
        // Connection status UI updates
        function updateStatus(status) {
            const indicator = document.getElementById('connection-status');
            const text = document.getElementById('connection-text');
            
            indicator.className = 'status-indicator status-' + status;
            text.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        }
        
        // Handle incoming messages
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'connectionStatus') {
                updateStatus(message.status);
            } else if (message.command === 'assistantMessage') {
                const panel = document.getElementById('message-panel');
                const msgElement = document.createElement('div');
                msgElement.textContent = message.content;
                panel.appendChild(msgElement);
                panel.scrollTop = panel.scrollHeight;
            }
        });
        
        // Rest of the clean implementation...
    </script>
</body>
</html>`;
    }
}

interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

interface GraphNode {
    id: string;
    label: string;
    type: string;
    color: string;
    issues?: string[];
    hasIssues?: boolean;
}

interface GraphEdge {
    source: string;
    target: string;
    type: string;
}