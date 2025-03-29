import * as vscode from 'vscode';
import { ProjectExplorer } from './views/ProjectExplorer';

export function activate(context: vscode.ExtensionContext) {
    // Register project explorer view
    const projectExplorer = new ProjectExplorer(context);
    const treeView = vscode.window.createTreeView('indicabProjectExplorer', {
        treeDataProvider: projectExplorer
    });

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('indicab.start', () => {
            vscode.window.showInformationMessage('IndiCab Development Tools activated!');
            projectExplorer.refresh();
        }),
        vscode.commands.registerCommand('indicab.refresh', () => {
            projectExplorer.refresh();
        }),
        vscode.commands.registerCommand('indicab.openFile', (filePath: string) => {
            vscode.window.showTextDocument(vscode.Uri.file(filePath));
        })
    );

    // Watch for workspace changes
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.{java,xml,gradle}');
    watcher.onDidChange(() => projectExplorer.refresh());
    watcher.onDidCreate(() => projectExplorer.refresh());
    watcher.onDidDelete(() => projectExplorer.refresh());
    context.subscriptions.push(watcher);

    context.subscriptions.push(treeView);
}

export function deactivate() {}
