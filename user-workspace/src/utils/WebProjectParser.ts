import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { WebComponent, WebProjectStructure, RouteDefinition } from './JavaProjectParser';

export class WebProjectParser {
    private static readonly WEB_SOURCE_DIRS = ['src', 'app', 'pages'];
    private static readonly COMPONENT_FILES = ['.jsx', '.tsx', '.vue'];
    private static readonly API_FILES = ['.ts', '.js'];

    static async parseProject(rootPath: string): Promise<WebProjectStructure> {
        const structure: WebProjectStructure = {
            rootPath,
            sourceRoots: [],
            resources: [],
            components: [],
            pages: [],
            apis: [],
            layouts: [],
            routes: []
        };

        // Find source roots
        structure.sourceRoots = this.WEB_SOURCE_DIRS
            .map(dir => path.join(rootPath, dir))
            .filter(dir => fs.existsSync(dir));

        // Parse web structure
        structure.components = await this.parseComponents(rootPath);
        structure.pages = await this.parsePages(rootPath);
        structure.layouts = await this.parseLayouts(rootPath);
        structure.apis = await this.parseApis(rootPath);
        structure.routes = await this.parseRoutes(rootPath);

        return structure;
    }

    private static async parseComponents(dir: string): Promise<WebComponent[]> {
        // Implementation would parse:
        // - Component files (.jsx, .vue)
        // - Props interfaces
        // - Dependency imports
        return [];
    }

    private static async parsePages(dir: string): Promise<WebComponent[]> {
        const pages: WebComponent[] = [];
        const pageFiles = await this.findFiles(dir, this.COMPONENT_FILES);
        
        for (const file of pageFiles) {
            if (file.includes('/pages/') || file.includes('/app/')) {
                const content = fs.readFileSync(file, 'utf-8');
                pages.push({
                    name: path.basename(file).split('.')[0],
                    type: 'PAGE',
                    path: file,
                    props: this.extractProps(content),
                    dependencies: this.extractDependencies(content),
                    routes: this.extractRoutes(content)
                });
            }
        }
        return pages;
    }

    private static async parseLayouts(dir: string): Promise<WebComponent[]> {
        const layouts: WebComponent[] = [];
        const layoutFiles = await this.findFiles(dir, this.COMPONENT_FILES);
        
        for (const file of layoutFiles) {
            if (file.includes('/layouts/') || file.includes('/app/layout')) {
                const content = fs.readFileSync(file, 'utf-8');
                layouts.push({
                    name: path.basename(file).split('.')[0],
                    type: 'LAYOUT',
                    path: file,
                    props: this.extractProps(content),
                    dependencies: this.extractDependencies(content)
                });
            }
        }
        return layouts;
    }

    private static async parseApis(dir: string): Promise<WebComponent[]> {
        const apis: WebComponent[] = [];
        const apiFiles = await this.findFiles(dir, this.API_FILES);
        
        for (const file of apiFiles) {
            if (file.includes('/api/') || file.includes('/services/')) {
                const content = fs.readFileSync(file, 'utf-8');
                apis.push({
                    name: path.basename(file).split('.')[0],
                    type: 'API',
                    path: file,
                    dependencies: this.extractDependencies(content),
                    apiEndpoints: this.extractApiEndpoints(content)
                });
            }
        }
        return apis;
    }

    private static async parseRoutes(dir: string): Promise<RouteDefinition[]> {
        // Would parse route config files (next.js, nuxt.js, etc)
        return [];
    }

    private static async findFiles(dir: string, extensions: string[]): Promise<string[]> {
        const files: string[] = [];
        await this.walkDirectory(dir, (filePath) => {
            if (extensions.some(ext => filePath.endsWith(ext))) {
                files.push(filePath);
            }
        });
        return files;
    }

    private static extractProps(content: string): string[] {
        // Extract props from component definition
        const propMatches = content.match(/interface\s+\w+Props\s*{([^}]*)}/);
        return propMatches ? propMatches[1].split(';').map(p => p.trim()).filter(Boolean) : [];
    }

    private static extractDependencies(content: string): string[] {
        // Extract imported components
        return Array.from(content.matchAll(/from\s+['"]([^'"]+)['"]/g))
            .map(m => m[1]);
    }

    private static extractRoutes(content: string): string[] {
        // Extract route paths from page components
        return Array.from(content.matchAll(/path:\s*['"]([^'"]+)['"]/g))
            .map(m => m[1]);
    }

    private static extractApiEndpoints(content: string): string[] {
        // Extract API endpoint definitions
        return Array.from(content.matchAll(/['"](https?:\/\/[^'"]+)['"]/g))
            .map(m => m[1]);
    }

    private static async walkDirectory(dir: string, callback: (filePath: string) => void): Promise<void> {
        if (!fs.existsSync(dir)) return;
        
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isDirectory()) {
                await this.walkDirectory(filePath, callback);
            } else {
                callback(filePath);
            }
        }
    }
}