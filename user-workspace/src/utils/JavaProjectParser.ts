import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { JavaParser } from './JavaParser';

export interface ProjectStructureBase {
    rootPath: string;
    sourceRoots: string[];
    resources: string[];
}

export interface JavaProjectStructure extends ProjectStructureBase {
    packages: JavaPackage[];
    buildFiles: BuildFile[];
}

export interface WebProjectStructure extends ProjectStructureBase {
    components: WebComponent[];
    pages: WebComponent[];
    apis: WebComponent[];
    layouts: WebComponent[];
    routes: RouteDefinition[];
    styles: WebComponent[];
}

export interface RouteDefinition {
    path: string;
    component: string;
    layout?: string;
    apiEndpoints?: string[];
}

export interface JavaPackage {
    name: string;
    path: string;
    classes: JavaClass[];
}

export interface WebComponent {
    name: string;
    type: 'PAGE' | 'COMPONENT' | 'LAYOUT' | 'API' | 'STYLE';
    path: string;
    dependencies: string[];
    routes?: string[];
    apiEndpoints?: string[];
    props?: string[]; // Made optional since API components don't have props
    mdxFeatures?: {
        components: string[];
        styles: string[];
        frontmatter: Record<string, any>;
    };
    htmlFeatures?: {
        attributes: Record<string, string>;
        elements: string[];
        stylesheets: string[];
        scripts: string[];
    };
    cssVariables?: {
        definitions: Record<string, string>;
        usages: string[];
    };
}

export interface JavaClass {
    name: string;
    type: 'CLASS' | 'INTERFACE' | 'ENUM';
    path: string;
    methods: JavaMethod[];
    fields: JavaField[];
    imports?: string[];
    annotations?: string[];
    dependencies?: string[];
    isTest: boolean;
    isInterface: boolean;
    superClass?: string;
    interfaces?: string[];
    issues?: string[];
    hasIssues?: boolean;
}

export interface JavaMethod {
    name: string;
    returnType: string;
    parameters: {name: string, type: string}[];
    visibility?: 'public' | 'private' | 'protected';
}

export interface JavaField {
    name: string;
    type: string;
    visibility?: 'public' | 'private' | 'protected';
}

export interface JavaImport {
    path: string;
    isStatic: boolean;
}

export interface BuildFile {
    type: 'MAVEN' | 'GRADLE';
    path: string;
}

export class JavaProjectParser {
    private static readonly JAVA_SOURCE_DIRS = ['src/main/java', 'src'];
    private static readonly BUILD_FILES = ['pom.xml', 'build.gradle'];

    public static async parseProject(projectPath: string): Promise<JavaProjectStructure> {
        const structure: JavaProjectStructure = {
            rootPath: projectPath,
            sourceRoots: [],
            packages: [],
            buildFiles: [],
            resources: []
        };

        // Find build files
        structure.buildFiles = this.findBuildFiles(projectPath);

        // Find source roots
        structure.sourceRoots = await this.findSourceRoots(projectPath);

        // Parse packages and classes
        for (const sourceRoot of structure.sourceRoots) {
            const packages = await this.parsePackages(sourceRoot);
            structure.packages.push(...packages);
            
            // Find resource files in source root
            const resourceFiles = await this.findResourceFiles(sourceRoot);
            structure.resources.push(...resourceFiles);
        }

        return structure;
    }

    public static findBuildFiles(projectPath: string): BuildFile[] {
        return this.BUILD_FILES
            .map(file => {
                const buildType: 'MAVEN' | 'GRADLE' = file === 'pom.xml' ? 'MAVEN' : 'GRADLE';
                return {
                    path: path.join(projectPath, file),
                    type: buildType
                };
            })
            .filter(buildFile => fs.existsSync(buildFile.path));
    }

    private static async findSourceRoots(projectPath: string): Promise<string[]> {
        const sourceRoots: string[] = [];
        
        for (const dir of this.JAVA_SOURCE_DIRS) {
            const fullPath = path.join(projectPath, dir);
            if (fs.existsSync(fullPath)) {
                sourceRoots.push(fullPath);
            }
        }

        // Fallback to project root if no standard source dirs found
        if (sourceRoots.length === 0) {
            sourceRoots.push(projectPath);
        }

        return sourceRoots;
    }

    private static async parsePackages(sourceRoot: string): Promise<JavaPackage[]> {
        const packages: JavaPackage[] = [];
        await this.walkDirectory(sourceRoot, async (filePath, stats) => {
            if (stats.isDirectory()) {
                const relPath = path.relative(sourceRoot, filePath);
                const packageName = relPath.replace(/\//g, '.');
                
                const javaFiles = fs.readdirSync(filePath)
                    .filter(f => f.endsWith('.java'))
                    .map(f => path.join(filePath, f));

                if (javaFiles.length > 0) {
            const classes = await Promise.all(javaFiles.map(f => this.parseJavaFile(f)));
            packages.push({
                name: packageName,
                path: filePath,
                classes: classes.filter(c => c !== null) as JavaClass[]
            });
                }
            }
        });

        return packages;
    }

    private static async parseJavaFile(filePath: string): Promise<JavaClass | null> {
        return JavaParser.parseFile(filePath);
    }

    private static async findResourceFiles(dir: string): Promise<string[]> {
        const resources: string[] = [];
        await this.walkDirectory(dir, async (filePath, stats) => {
            if (!stats.isDirectory() && !filePath.endsWith('.java')) {
                resources.push(filePath);
            }
        });
        return resources;
    }

    private static async walkDirectory(dir: string, callback: (filePath: string, stats: fs.Stats) => Promise<void>): Promise<void> {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            await callback(filePath, stats);
            if (stats.isDirectory()) {
                await this.walkDirectory(filePath, callback);
            }
        }
    }
}