import * as vscode from 'vscode';
import * as path from 'path';
import { JavaProjectParser, JavaProjectStructure, JavaPackage, JavaClass, BuildFile } from '../utils/JavaProjectParser';
import { Colors } from '../utils/DesignSystem';

export class ProjectExplorer implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null> = new vscode.EventEmitter();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null> = this._onDidChangeTreeData.event;
    private projectStructure: JavaProjectStructure | null = null;
    private loading = false;

    constructor(private context: vscode.ExtensionContext) {
        this.refresh();
    }

    private createOpenFileCommand(filePath: string, title: string): vscode.Command {
        const normalizedPath = path.normalize(filePath);
        const uri = vscode.Uri.file(normalizedPath);
        // Add required internal properties
        (uri as any).$mid = 1;
        (uri as any)._formatted = uri.toString();
        (uri as any)._fsPath = uri.fsPath;

        return {
            command: 'vscode.open',
            title: title,
            arguments: [uri]
        } as vscode.Command;
    }

    async refresh(): Promise<void> {
        this.loading = true;
        this._onDidChangeTreeData.fire(undefined);
        
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            this.loading = false;
            vscode.window.showWarningMessage('No workspace folder open');
            return;
        }

        try {
            const rootPath = workspaceFolders[0].uri.fsPath;
            this.projectStructure = await JavaProjectParser.parseProject(rootPath);
        } catch (err) {
            console.error('Error parsing project:', err);
            vscode.window.showErrorMessage(
                `Failed to parse project: ${err instanceof Error ? err.message : String(err)}`
            );
        } finally {
            this.loading = false;
            this._onDidChangeTreeData.fire(undefined);
        }
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (this.loading) return [new vscode.TreeItem('Loading...')];
        if (!this.projectStructure) return [new vscode.TreeItem('No project found')];

        if (!element) {
            return [
                this.createTreeItem('Packages', 'package', vscode.TreeItemCollapsibleState.Collapsed),
                this.createTreeItem('Build Files', 'build', vscode.TreeItemCollapsibleState.Collapsed),
                this.createTreeItem('Resources', 'resource', vscode.TreeItemCollapsibleState.Collapsed)
            ];
        }

        if (element.label === 'Packages') {
            return this.projectStructure.packages.map(pkg => 
                this.createTreeItem(pkg.name, 'package', vscode.TreeItemCollapsibleState.Collapsed, pkg.path)
            );
        }

        if (element.label === 'Build Files') {
            return this.projectStructure.buildFiles.map(file => 
                this.createTreeItem(path.basename(file.path), file.type.toLowerCase(), vscode.TreeItemCollapsibleState.None, file.path)
            );
        }

        if (element.label === 'Resources') {
            return this.projectStructure.resources.map(resource => 
                this.createTreeItem(path.basename(resource), 'resource', vscode.TreeItemCollapsibleState.None, resource)
            );
        }

        // Handle package contents
        if (element.contextValue === 'package') {
            const pkg = this.projectStructure.packages.find(p => p.name === element.label);
            if (!pkg) return [];
            
            return pkg.classes.map(cls => 
                this.createTreeItem(
                    cls.name, 
                    cls.type.toLowerCase(), 
                    vscode.TreeItemCollapsibleState.None, 
                    cls.path,
                    cls.isTest ? 'test' : undefined
                )
            );
        }

        return [];
    }

    private createTreeItem(
        label: string,
        iconType: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        filePath?: string,
        contextValue?: string
    ): vscode.TreeItem {
        const item = new vscode.TreeItem(label, collapsibleState);
        item.iconPath = this.getIconPath(iconType, contextValue === 'test');
        item.contextValue = contextValue || iconType;
        
        if (filePath) {
            item.command = {
                command: 'indicab.openFile',
                title: 'Open File',
                arguments: [filePath]
            };
            item.tooltip = filePath;
            item.resourceUri = vscode.Uri.file(filePath);
        }

        return item;
    }

    private getIconPath(type: string, isTest = false): vscode.ThemeIcon {
        const iconMap: Record<string, string> = {
            'package': 'package',
            'class': 'symbol-class',
            'interface': 'symbol-interface',
            'enum': 'symbol-enum',
            'build': 'tools',
            'resource': 'file',
            'test': 'beaker'
        };

        const iconName = isTest ? 'test' : iconMap[type] || 'file';
        return new vscode.ThemeIcon(iconName, isTest ? new vscode.ThemeColor('errorForeground') : undefined);
    }
}