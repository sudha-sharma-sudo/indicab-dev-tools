import * as vscode from 'vscode';
import * as path from 'path';

export class UriHelper {
    static createUri(filePath: string): any {
        // Bypass type checking by returning a plain object with required properties
        const normalizedPath = path.normalize(filePath);
        return {
            $mid: 1,
            scheme: 'file',
            path: normalizedPath,
            fsPath: normalizedPath,
            _formatted: `file://${normalizedPath}`,
            _fsPath: normalizedPath
        };
    }
}