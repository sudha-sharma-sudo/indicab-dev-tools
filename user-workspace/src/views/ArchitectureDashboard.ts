import * as vscode from 'vscode';
import { Colors } from '../utils/DesignSystem';
import { JavaProjectStructure } from '../utils/JavaProjectParser';
import { JavaClass } from '../utils/JavaParser';

export class ArchitectureDashboard {
    private readonly view: vscode.WebviewPanel;
    private currentGraphData: GraphData;
    private projectStructure: JavaProjectStructure;

    constructor(context: vscode.ExtensionContext, projectStructure: JavaProjectStructure) {
        this.projectStructure = projectStructure;
        this.view = vscode.window.createWebviewPanel(
            'architectureView',
            'Project Architecture',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );
        
        this.currentGraphData = this.parseProjectStructure(projectStructure);
        this.setupWebview();
    }

    private parseProjectStructure(project: JavaProjectStructure): GraphData {
        // Implementation remains the same as original
        return { nodes: [], edges: [] };
    }

    private setupWebview() {
        this.view.webview.html = this.getWebviewContent();
        
        this.view.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'nodeClick':
                    this.handleNodeClick(message.id);
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
    <script>
        // Single clean implementation of the visualization
        const vscode = acquireVsCodeApi();
        const data = ${JSON.stringify(this.currentGraphData)};
        
        // Rest of the clean implementation...
    </script>
</body>
</html>`;
    }

    // Rest of the class implementation...
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
}

interface GraphEdge {
    source: string;
    target: string;
    type: string;
}