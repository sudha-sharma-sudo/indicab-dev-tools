# IndiCab Development Tools

![Extension Icon](icon.png)

VS Code extension for IndiCab Java full-stack development with features for:
- Java project analysis
- Code navigation
- Project structure visualization
- Build file management

## Installation
1. Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=indicab-dev-tools)
2. Or load from VSIX:
```bash
code --install-extension indicab-dev-tools-0.0.1.vsix
```

## Features

### Architecture Dashboard
![Architecture Dashboard Example](docs/screenshots/architecture-dashboard.png)  
*Example visualization of a Spring Boot project structure*

Interactive visualization of Java project architecture with:
- Force-directed graph layout
- Color-coded nodes (classes, interfaces, enums, tests)
- Relationship edges (inheritance, dependencies, imports)
- Click-to-navigate source files
- Real-time refresh

### Project Explorer 
Visualize Java project structure with:
- Package hierarchy
- Class/method navigation  
- Build file support
- Resource management

### Smart Navigation
- Jump between related files
- Follow dependencies
- Quick access to tests

### Build Tools
- Gradle/Maven file support
- Build configuration analysis
- Dependency visualization

### Code Analysis
- AST-based parsing
- Method/field insights
- Type relationship mapping

## Usage

### Architecture Dashboard
1. Open a Java project in VS Code  
2. Run command: `Show Architecture Dashboard`  
3. Interact with the visualization:  
   - Click nodes to open source files  
   - Hover for details  
   - Use mouse wheel to zoom  
   - Drag to pan  
   - Right-click to refresh  

### Project Explorer  
1. Open the IndiCab Project view  
2. Browse packages and classes  
3. Click items to open files  

## Configuration  
```json
"indicab.logLevel": "info",
"indicab.fileWatchPatterns": ["**/*.java", "**/*.xml"],
"indicab.enableCache": true,
"indicab.cacheTTL": 300
```

## Development
See [DEPLOYMENT.md](DEPLOYMENT.md) for publishing instructions.

## Design System

### Documentation
- [Style Guide](docs/style-guide.md) - Colors, typography, spacing and visual styles
- [Interaction Patterns](docs/interaction-patterns.md) - User interface behaviors
- [Accessibility](docs/accessibility.md) - WCAG 2.1 AA compliance guidelines

### Assets
- [Project Navigator Wireframe](assets/design/wireframes/project_navigator.md)
- [Architecture Dashboard Wireframe](assets/design/wireframes/architecture_dashboard.md)
- [Design Tokens](src/utils/DesignSystem.ts) - Centralized design constants

### Implementation
The extension follows VS Code's design system while adding IndiCab-specific components:
- Color-coded file types
- Interactive architecture visualization
- Context-aware navigation

## License
MIT © 2023 IndiCab Development Team
