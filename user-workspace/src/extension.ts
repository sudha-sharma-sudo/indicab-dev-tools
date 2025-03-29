import * as vscode from 'vscode';
import { ProjectExplorer } from './views/ProjectExplorer';
import { Logger } from './utils/Logger';
import { JavaParser } from './utils/JavaParser';
import { JavaProjectParser } from './utils/JavaProjectParser';
import { ArchitectureDashboard } from './views/ArchitectureDashboard';
import { CodeAnalyzer } from './utils/CodeAnalyzer';
import { CodeActionProvider } from './providers/CodeActionProvider';

export function activate(context: vscode.ExtensionContext) {
    // Initialize logger
    Logger.initialize(context);
    Logger.setLogLevel(getConfig().get<('error' | 'warn' | 'info' | 'debug')>('logLevel') || 'info');
    Logger.info('Initializing IndiCab Development Tools');

    try {
        // Register project explorer view
        const projectExplorer = new ProjectExplorer(context);
        const treeView = vscode.window.createTreeView('indicabProjectExplorer', {
            treeDataProvider: projectExplorer
        });

        // Initialize code analysis and register providers
        const codeAnalyzer = new CodeAnalyzer();
        context.subscriptions.push(
            CodeActionProvider.register(context, codeAnalyzer),
            vscode.commands.registerCommand('indicab.start', () => {
                Logger.info('Extension activated');
                vscode.window.showInformationMessage('IndiCab Development Tools activated!');
                projectExplorer.refresh();
            }),
            vscode.commands.registerCommand('indicab.refresh', () => {
                Logger.debug('Manual refresh triggered');
                projectExplorer.refresh();
            }),
            vscode.commands.registerCommand('indicab.openFile', (filePath: string) => {
                Logger.debug(`Opening file: ${filePath}`);
                vscode.window.showTextDocument(vscode.Uri.file(filePath))
                    .then(
                        () => Logger.debug(`File opened: ${filePath}`),
                        (err: Error) => Logger.error(`Failed to open file: ${filePath}`, err)
                    );
            }),
            vscode.commands.registerCommand('indicab.clearCache', () => {
                Logger.info('Clearing parser cache');
                JavaParser.clearCache();
                vscode.window.showInformationMessage('Parser cache cleared');
                projectExplorer.refresh();
            }),
            
            // Architecture Dashboard command
            vscode.commands.registerCommand('indicab.showArchitectureDashboard', async () => {
                try {
                    Logger.info('Opening Architecture Dashboard');
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (!workspaceFolders || workspaceFolders.length === 0) {
                        vscode.window.showWarningMessage('No workspace folder open');
                        return;
                    }

                    const rootPath = workspaceFolders[0].uri.fsPath;
                    const projectStructure = await JavaProjectParser.parseProject(rootPath);
                    new ArchitectureDashboard(context, projectStructure);
                } catch (error) {
                    Logger.error('Failed to open Architecture Dashboard', error as Error);
                    vscode.window.showErrorMessage(
                        `Failed to open Architecture Dashboard: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }),
        );

        // Watch for workspace changes with debounce
        const watchPatterns = getConfig().get<string[]>('fileWatchPatterns') || ['**/*.java', '**/*.xml', '**/*.gradle'];
        const watchers = watchPatterns.map(pattern => {
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);
            
            const debouncedRefresh = debounce(() => {
                Logger.debug('Workspace changes detected, refreshing...');
                projectExplorer.refresh();
            }, 500);

            watcher.onDidChange(debouncedRefresh);
            watcher.onDidCreate(debouncedRefresh);
            watcher.onDidDelete(debouncedRefresh);
            context.subscriptions.push(watcher);
            return watcher;
        });

        context.subscriptions.push(
            treeView,
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('indicab.logLevel')) {
                    const newLevel = getConfig().get<('error' | 'warn' | 'info' | 'debug')>('logLevel') || 'info';
                    Logger.setLogLevel(newLevel);
                    Logger.info(`Log level changed to: ${newLevel}`);
                }
            })
        );

        Logger.info('Extension activation completed');
    } catch (error) {
        Logger.error('Failed to activate extension', error as Error);
        throw error;
    }
}

function getConfig() {
    return vscode.workspace.getConfiguration('indicab');
}

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return function(this: unknown, ...args: Parameters<T>) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

export function deactivate() {}
