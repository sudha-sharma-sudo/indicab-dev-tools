import * as vscode from 'vscode';
import { Colors } from '../utils/DesignSystem';
import { JavaProjectStructure, JavaClass } from '../utils/JavaProjectParser';

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
            { 
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        
        this.currentGraphData = this.parseProjectStructure(projectStructure);
        this.setupWebview();
    }

    private parseProjectStructure(project: JavaProjectStructure): GraphData {
        // Convert project structure to graph data
        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        
        // Process all classes
        for (const pkg of project.packages) {
            for (const cls of pkg.classes) {
                nodes.push({
                    id: cls.name,
                    label: cls.name,
                    type: cls.type,
                    isTest: cls.isTest,
                    color: this.getNodeColor(cls)
                });

                // Add edges for class dependencies
                if (cls.dependencies) {
                    cls.dependencies.forEach(dep => {
                        edges.push({
                            source: cls.name,
                            target: dep,
                            type: 'DEPENDENCY'
                        });
                    });
                } else if (cls.imports) {
                    // Fallback to imports if dependencies not parsed
                    cls.imports.forEach(imp => {
                        const depClass = imp.split('.').pop();
                        if (depClass) {
                            edges.push({
                                source: cls.name,
                                target: depClass,
                                type: 'IMPORT'
                            });
                        }
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

        return { nodes, edges };
    }

    private getNodeColor(cls: JavaClass): string {
        if (cls.isTest) return Colors.test;
        if (cls.type === 'INTERFACE') return Colors.interface;
        if (cls.type === 'ENUM') return Colors.secondaryLight;
        return Colors.class;
    }

    private setupWebview() {
        this.view.webview.html = this.getWebviewContent();
        
        // Handle messages from the webview
        this.view.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'nodeClick':
                    this.handleNodeClick(message.id);
                    break;
                case 'refresh':
                    this.refresh();
                    break;
            }
        });
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Architecture</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body { margin: 0; padding: 0; overflow: hidden; }
        #graph { width: 100%; height: 100vh; }
        .node { stroke: #fff; stroke-width: 1.5px; cursor: pointer; }
        .link { stroke: #999; stroke-opacity: 0.6; }
        .node-text { font-size: 12px; font-weight: bold; pointer-events: none; }
        .tooltip {
            position: absolute;
            padding: 8px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 4px;
            pointer-events: none;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div id="graph"></div>
    <div class="tooltip" style="opacity:0"></div>
    <script>
        const vscode = acquireVsCodeApi();
        const data = ${JSON.stringify(this.currentGraphData)};
        const tooltip = d3.select('.tooltip');
        const width = document.getElementById('graph').clientWidth;
        const height = document.getElementById('graph').clientHeight;

        // Create force-directed graph
        const simulation = d3.forceSimulation(data.nodes)
            .force('charge', d3.forceManyBody().strength(-500))
            .force('link', d3.forceLink(data.edges).id(d => d.id).distance(100))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(30));

        const svg = d3.select('#graph')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .call(d3.zoom()
                .scaleExtent([0.1, 8])
                .on('zoom', (event) => {
                    g.attr('transform', event.transform);
                }))
            .append('g');

        const g = svg.append('g');

        // Draw edges
        const link = g.append('g')
            .selectAll('line')
            .data(data.edges)
            .enter()
            .append('line')
        .attr('class', 'link')
        .attr('stroke-width', d => d.type === 'INHERITANCE' ? 2.5 : 1.5)
        .attr('stroke', d => {
            switch(d.type) {
                case 'INHERITANCE': return '#4EC9B0'; // Teal
                case 'DEPENDENCY': return '#569CD6'; // Blue 
                default: return '#999'; // Gray for imports
            }
        })
        .attr('stroke-dasharray', d => d.type === 'IMPORT' ? '3,3' : null);

        // Draw nodes
        const node = g.append('g')
            .selectAll('circle')
            .data(data.nodes)
            .enter()
            .append('circle')
            .attr('class', 'node')
            .attr('r', d => d.type === 'INTERFACE' ? 10 : 12)
            .attr('fill', d => d.color)
            .on('click', (event, d) => {
                vscode.postMessage({ command: 'nodeClick', id: d.id });
            })
            .on('mouseover', (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0.9);
                tooltip.html(d.label)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Add node labels
        const labels = g.append('g')
            .selectAll('text')
            .data(data.nodes)
            .enter()
            .append('text')
            .attr('class', 'node-text')
            .attr('dy', 4)
            .text(d => d.label)
            .attr('fill', 'white');

        // Update positions on simulation tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            labels
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });
    </script>
</body>
</html>`;
    }

    private handleNodeClick(nodeId: string) {
        // Find the class with matching name
        let classPath: string | undefined;
        
        // Search through all packages and classes
        for (const pkg of this.currentGraphData.nodes) {
            if (pkg.id === nodeId) {
                // Find the corresponding class in the original project structure
                for (const projectPkg of this.projectStructure?.packages || []) {
                    const foundClass = projectPkg.classes.find((cls: JavaClass) => cls.name === nodeId);
                    if (foundClass) {
                        classPath = foundClass.path;
                        break;
                    }
                }
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
            }, (err: Error) => {
                vscode.window.showErrorMessage(`Failed to open file: ${classPath}\n${err.message}`);
            });
        } else {
            vscode.window.showWarningMessage(`Could not find source file for class: ${nodeId}`);
        }
    }

    private async refresh() {
        try {
            // Re-parse the project structure
            this.currentGraphData = this.parseProjectStructure(this.projectStructure);
            
            // Post updated data to webview
            this.view.webview.postMessage({
                command: 'updateData',
                data: this.currentGraphData
            });
            
            // Update webview title to show refresh time
            this.view.title = `Project Architecture (Last updated: ${new Date().toLocaleTimeString()})`;
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to refresh architecture view: ${error instanceof Error ? error.message : String(error)}`
            );
        }
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
    isTest: boolean;
    color: string;
}

interface GraphEdge {
    source: string;
    target: string;
    type: string;
}