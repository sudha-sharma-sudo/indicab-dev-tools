import * as vscode from 'vscode';
import * as path from 'path';
import { JavaParser } from '../utils/JavaParser';
import { JavaProjectParser, JavaProjectStructure, JavaPackage, JavaClass, BuildFile } from '../utils/JavaProjectParser';

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
            const classes = await JavaParser.parseProjectFiles(rootPath);
            
            this.projectStructure = {
                rootPath,
                sourceRoots: [...new Set(classes.map((c: JavaClass) => path.dirname(c.path)))],
                packages: this.groupClassesIntoPackages(classes),
                buildFiles: JavaProjectParser.findBuildFiles(rootPath)
            };

            vscode.window.showInformationMessage(`Parsed ${classes.length} Java files`);
        } catch (err) {
            console.error('Error parsing project:', err);
            vscode.window.showErrorMessage(`Failed to parse project: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            this.loading = false;
            this._onDidChangeTreeData.fire(undefined);
        }
    }

    private groupClassesIntoPackages(classes: JavaClass[]): JavaPackage[] {
        const packageMap = new Map<string, JavaPackage>();
        
        for (const cls of classes) {
            const packagePath = path.dirname(cls.path);
            const packageName = this.pathToPackageName(packagePath);

            if (!packageMap.has(packageName)) {
                packageMap.set(packageName, {
                    name: packageName,
                    path: packagePath,
                    classes: []
                });
            }
            packageMap.get(packageName)!.classes.push(cls);
        }

        return Array.from(packageMap.values());
    }

    private pathToPackageName(packagePath: string): string {
        // Convert file path to Java package name
        return packagePath.split(path.sep)
            .filter(part => part !== 'src' && part !== 'main' && part !== 'java')
            .join('.');
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
                this.createCategoryItem('Build Files', 'build', this.projectStructure.buildFiles)
            ];
        }

        const context = element.contextValue;
        if (context === 'package') {
            return this.projectStructure.packages.map(pkg => this.createPackageItem(pkg));
        }
        else if (context === 'build') {
            return this.projectStructure.buildFiles.map(build => this.createBuildFileItem(build));
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
}
