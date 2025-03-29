import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from './Logger';

type JavaASTNode = {
    kind: string;
    name: string;
    annotations?: { name: string }[];
    members?: JavaASTNode[];
    returnType?: string;
    parameters?: { type: string; name: string }[];
    type?: string;
};

export class JavaParser {
    private static cache = new Map<string, JavaASTNode>();

    public static parseFile(filePath: string): JavaClass | null {
        try {
            // Check cache first
            if (this.cache.has(filePath)) {
                return this.transformASTToClass(this.cache.get(filePath)!, filePath);
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            const ast = this.parseJavaContent(content);
            this.cache.set(filePath, ast);
            
            return this.transformASTToClass(ast, filePath);
        } catch (err) {
            Logger.error(`Java parsing failed for ${filePath}`, err as Error);
            return null;
        }
    }

    private static parseJavaContent(content: string): JavaASTNode {
        // Simplified AST parsing (would integrate with real Java parser)
        const ast: JavaASTNode = {
            kind: 'compilationUnit',
            name: '',
            members: []
        };

        // Detect class/interface/enum
        const classMatch = content.match(/(class|interface|enum)\s+(\w+)/);
        if (classMatch) {
            ast.kind = classMatch[1];
            ast.name = classMatch[2];
        }

        // Parse annotations
        const annotationMatches = content.match(/@(\w+)/g) || [];
        ast.annotations = [...new Set(annotationMatches)]
            .map(a => ({ name: a.substring(1) }));

        // Parse methods
        const methodRegex = /(public|private|protected)\s+([\w<>]+)\s+(\w+)\s*\(([^)]*)\)/g;
        let methodMatch;
        ast.members = ast.members || [];
        
        while ((methodMatch = methodRegex.exec(content)) !== null) {
            ast.members.push({
                kind: 'method',
                name: methodMatch[3],
                returnType: methodMatch[2],
                parameters: methodMatch[4].split(',')
                    .filter(p => p.trim())
                    .map(p => {
                        const parts = p.trim().split(/\s+/);
                        return {
                            type: parts.slice(0, -1).join(' '),
                            name: parts[parts.length - 1]
                        };
                    })
            });
        }

        // Parse fields
        const fieldRegex = /(public|private|protected)\s+([\w<>]+)\s+(\w+)\s*[;=]/g;
        let fieldMatch;
        
        while ((fieldMatch = fieldRegex.exec(content)) !== null) {
            ast.members.push({
                kind: 'field',
                name: fieldMatch[3],
                type: fieldMatch[2]
            });
        }

        return ast;
    }

    private static transformASTToClass(ast: JavaASTNode, filePath: string): JavaClass {
        const className = path.basename(filePath, '.java');
        const isTest = filePath.includes('test') || 
                      ast.annotations?.some(a => a.name === 'Test');

        return {
            name: className,
            type: ast.kind === 'interface' ? 'INTERFACE' : 
                 ast.kind === 'enum' ? 'ENUM' : 'CLASS',
            path: filePath,
            methods: ast.members?.filter(m => m.kind === 'method').map(m => ({
                name: m.name!,
                returnType: m.returnType!,
                parameters: m.parameters || []
            })) || [],
            fields: ast.members?.filter(m => m.kind === 'field').map(m => ({
                name: m.name!,
                type: m.type!
            })) || [],
            isTest: isTest || false,
            isInterface: ast.kind === 'interface',
            springComponent: this.detectSpringComponent(ast),
            annotations: ast.annotations?.map(a => a.name),
            endpoints: this.detectEndpoints(ast)
        };
    }

    private static detectSpringComponent(ast: JavaASTNode): {
        type?: 'CONTROLLER' | 'SERVICE' | 'REPOSITORY';
        endpoints?: {path: string, method: string}[];
        dependencies?: string[];
    } {
        const result: SpringComponentData = {
            type: undefined,
            endpoints: [],
            dependencies: []
        };

        // Check class-level annotations
        ast.annotations?.forEach(annotation => {
            const annUpper = annotation.name.toUpperCase();
            if (annUpper === 'CONTROLLER' || annUpper === 'RESTCONTROLLER') {
                result.type = 'CONTROLLER';
            } else if (annUpper === 'SERVICE' || annUpper === 'COMPONENT') {
                result.type = 'SERVICE';
            } else if (annUpper === 'REPOSITORY') {
                result.type = 'REPOSITORY';
            }
        });

        // Detect endpoints for controllers
        if (result.type === 'CONTROLLER') {
            ast.members?.filter(m => m.kind === 'method').forEach(method => {
                method.annotations?.forEach(ann => {
                    const annUpper = ann.name.toUpperCase();
                    if (annUpper.endsWith('MAPPING')) {
                        const methodType = annUpper.replace('MAPPING', '') || 'GET';
                        const path = this.extractPathFromAnnotation(ann.name);
                        result.endpoints?.push({
                            method: methodType,
                            path: path
                        });
                    }
                });
            });
        }

        // Detect autowired dependencies
        ast.members?.filter(m => m.kind === 'field').forEach(field => {
            if (field.annotations?.some(a => a.name === 'Autowired')) {
                result.dependencies?.push(field.type!);
            }
        });

        return result;
    }

    private static extractPathFromAnnotation(annotation: string): string {
        // Extract path value from annotation
        const pathMatch = annotation.match(/value\s*=\s*["'](.+?)["']/);
        return pathMatch ? pathMatch[1] : '/';
    }

    private static detectEndpoints(ast: JavaASTNode): Endpoint[] {
        return ast.members?.filter(m => 
            m.kind === 'method' && 
            m.annotations?.some(a => 
                ['GetMapping', 'PostMapping', 'PutMapping', 'DeleteMapping', 'RequestMapping']
                    .includes(a.name)
            )
        ).map(m => {
            const mapping = m.annotations?.find(a => 
                a.name.endsWith('Mapping')
            )?.name || 'RequestMapping';
            
            return {
                path: this.extractPathFromAnnotations(m.annotations || []),
                method: mapping.replace('Mapping', '').toUpperCase() || 'GET',
                returnType: m.returnType || 'void'
            };
        }) || [];
    }

    private static extractPathFromAnnotations(annotations: { name: string }[]): string {
        // Simplified path extraction
        const mapping = annotations.find(a => a.name.endsWith('Mapping'));
        return mapping ? `/${mapping.name.replace('Mapping', '').toLowerCase()}` : '/';
    }

    public static clearCache() {
        this.cache.clear();
    }
}

export interface Endpoint {
    path: string;
    method: string;
    returnType: string;
}

export interface SpringComponentData {
    type?: 'CONTROLLER' | 'SERVICE' | 'REPOSITORY';
    endpoints?: {path: string, method: string}[];
    dependencies?: string[];
}

export interface JavaClass {
    name: string;
    type: 'CLASS' | 'INTERFACE' | 'ENUM';
    path: string;
    methods: {
        name: string;
        returnType: string;
        parameters: { type: string; name: string }[];
    }[];
    fields: {
        name: string;
        type: string;
    }[];
    isTest: boolean;
    isInterface: boolean;
    springComponent?: SpringComponentData;
    annotations?: string[];
    endpoints?: Endpoint[];
}
