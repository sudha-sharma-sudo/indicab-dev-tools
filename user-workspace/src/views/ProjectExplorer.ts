import * as vscode from 'vscode';
import * as path from 'path';
import { JavaParser } from '../utils/JavaParser';
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
            vscode.window.showInformationMessage(`Parsed ${this.projectStructure.packages.flatMap(p => p.classes).length} Java files`);
        } catch (err) {
            console.error('Error parsing project:', err);
            vscode.window.showErrorMessage(`Failed to parse project: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            this.loading = false;
            this._onDidChangeTreeData.fire(undefined);
        }
    }


    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (this.loading) {
            return [new vscode.TreeItem('Loading project structure...')];
        }

        if (!this.projectStructure) {
            return [new vscode.TreeItem('No Java project found')];
        }

        if (!element) {
            // Root level items
            return [
                this.createCategoryItem('Packages', 'package', this.projectStructure.packages),
                this.createCategoryItem('Build Files', 'build', this.projectStructure.buildFiles),
                this.createCategoryItem('Resources', 'resource', this.projectStructure.resources)
            ];
        }

        const context = element.contextValue;
        if (context === 'package') {
            const pkg = this.projectStructure.packages.find(p => p.name === element.label);
            if (pkg) {
                return pkg.classes.map(cls => this.createClassItem(cls));
            }
        }
        else if (context === 'build') {
            return this.projectStructure.buildFiles.map(build => this.createBuildFileItem(build));
        }
        else if (context === 'resource') {
            return this.projectStructure.resources.map(res => this.createResourceItem(res));
        }

        return [];
    }

    private createCategoryItem(label: string, contextValue: string, items: any[]): vscode.TreeItem {
        const item = new vscode.TreeItem(
            label,
            items.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        );
        item.contextValue = contextValue;
        item.iconPath = new vscode.ThemeIcon('folder');
        return item;
    }

    private createPackageItem(pkg: JavaPackage): vscode.TreeItem {
        const item = new vscode.TreeItem(
            pkg.name,
            pkg.classes.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        );
        item.contextValue = 'package';
        item.iconPath = new vscode.ThemeIcon('package');
        item.tooltip = `${pkg.name}\n${pkg.path}\n${pkg.classes.length} classes`;
        item.command = {
            command: 'vscode.openFolder',
            title: 'Open Package',
            arguments: [vscode.Uri.file(pkg.path)]
        };
        
        // Add badge showing number of classes
        if (pkg.classes.length > 0) {
            item.description = `${pkg.classes.length} classes`;
        }
        
        return item;
    }

    private createClassItem(cls: JavaClass): vscode.TreeItem {
        const item = new vscode.TreeItem(
            cls.name,
            vscode.TreeItemCollapsibleState.None
        );
        
        // Set icon and color based on file type
        if (cls.isTest) {
            item.iconPath = {
                light: this.context.asAbsolutePath('assets/icons/test.svg'),
                dark: this.context.asAbsolutePath('assets/icons/test-dark.svg')
            };
            (item as any).color = new vscode.ThemeColor(Colors.test);
        } else if (cls.isInterface) {
            item.iconPath = {
                light: this.context.asAbsolutePath('assets/icons/interface.svg'),
                dark: this.context.asAbsolutePath('assets/icons/interface-dark.svg')
            };
            (item as any).color = new vscode.ThemeColor(Colors.interface);
        } else {
            item.iconPath = {
                light: this.context.asAbsolutePath('assets/icons/class.svg'),
                dark: this.context.asAbsolutePath('assets/icons/class-dark.svg')
            };
            (item as any).color = new vscode.ThemeColor(Colors.class);
        }

        item.tooltip = `${cls.name}\n${cls.path}`;
        item.command = {
            command: 'vscode.open',
            title: 'Open File',
            arguments: [vscode.Uri.file(cls.path)]
        };
        
        return item;
    }

    private createBuildFileItem(build: BuildFile): vscode.TreeItem {
        const item = new vscode.TreeItem(
            path.basename(build.path),
            vscode.TreeItemCollapsibleState.None
        );
        item.contextValue = 'build-file';
        item.iconPath = new vscode.ThemeIcon(build.type === 'MAVEN' ? 'file-code' : 'gear');
        item.tooltip = `${build.type} build file\n${build.path}`;
        item.command = {
            command: 'vscode.open',
            title: 'Open Build File',
            arguments: [vscode.Uri.file(build.path)]
        };
        
        // Add build type badge
        item.description = build.type;
        
        return item;
    }

    private createResourceItem(resource: string): vscode.TreeItem {
        const item = new vscode.TreeItem(
            path.basename(resource),
            vscode.TreeItemCollapsibleState.None
        );
        item.contextValue = 'resource-file';
        item.iconPath = {
            light: this.context.asAbsolutePath('assets/icons/resource.svg'),
            dark: this.context.asAbsolutePath('assets/icons/resource-dark.svg')
        };
        (item as any).color = new vscode.ThemeColor(Colors.resource);
        item.tooltip = `Resource file\n${resource}`;
        item.command = {
            command: 'vscode.open',
            title: 'Open Resource',
            arguments: [vscode.Uri.file(resource)]
        };
        
        return item;
    }
}
