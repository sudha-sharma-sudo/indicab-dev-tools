import * as vscode from 'vscode';

export interface ASTNode {
    type: string;
    range: vscode.Range;
    children?: ASTNode[];
    parent?: ASTNode;
}

export class ASTWalker {
    static walk(node: ASTNode, callback: (node: ASTNode) => void): void {
        callback(node);
        if (node.children) {
            node.children.forEach(child => this.walk(child, callback));
        }
    }

    static findNodes(node: ASTNode, predicate: (node: ASTNode) => boolean): ASTNode[] {
        const results: ASTNode[] = [];
        this.walk(node, n => {
            if (predicate(n)) {
                results.push(n);
            }
        });
        return results;
    }
}

export class PositionUtils {
    static contains(range: vscode.Range, position: vscode.Position): boolean {
        return range.start.compareTo(position) <= 0 && range.end.compareTo(position) >= 0;
    }
}