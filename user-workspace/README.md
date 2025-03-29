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
- **Project Explorer**: Visualize Java project structure
- **Smart Navigation**: Jump between related files
- **Build Tools**: Gradle/Maven file support
- **Code Analysis**: AST-based insights

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
