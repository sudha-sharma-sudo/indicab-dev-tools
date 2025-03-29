# Architecture Dashboard Wireframe

## Visual Structure
```plaintext
+-----------------------------------------------------+
| [Dashboard Header]                                  |
|  Title: Project Architecture       [Legend] [Help]  |
+-----------------------------------------------------+
|                                                     |
|  [Force-Directed Graph]                             |
|    • (UserController)─────┐                         |
|    │  ▲                   │                         |
|    │  │                   ▼                         |
|    • (UserService)─────▶(UserRepository)            |
|    │  ▲                   ▲                         |
|    ▼  │                   │                         |
|    • (AuthService)        • (SecurityConfig)        |
|                                                     |
+-----------------------------------------------------+
| [Detail Panel]                                      |
|  Selected: UserController                           |
|  Dependencies: 2                                    |
|  Dependents: 1                                      |
|  Methods: 5                                         |
|                                                     |
|  [Source Code Preview]                              |
+-----------------------------------------------------+
| [Status Bar]                                        |
|  [Zoom: 85%] [Layout: Auto] [Filters: Active]       |
+-----------------------------------------------------+
```

## Graph Components
1. **Nodes**
   - Shape Coding:
     - ○ Class (24px)
     - □ Interface (20px)
     - △ Test (20px)
     - ⬡ Config (20px)
   - Color Coding:
     - Controller: #C586C0 (purple)
     - Service: #4EC9B0 (teal)
     - Repository: #569CD6 (blue)
     - Config: #DCDCAA (beige)

2. **Edges**
   - Solid: Direct dependency
   - Dashed: Interface implementation
   - Thickness: Indicates coupling strength
   - Arrowheads: Show direction

## UI Controls
1. **Toolbar**
   - Zoom In/Out
   - Layout Algorithms:
     - Force-Directed (default)
     - Hierarchical
     - Circular
   - Filter Toggles:
     - Show/Hide Tests
     - Show/Hide Configs
     - Isolate Subsystem

2. **Detail Panel**
   - Selected node metadata
   - Source code preview
   - Quick navigation buttons

## Interactive Features
- **Node Selection**: Click to inspect
- **Multi-Select**: Shift+Click or drag selection
- **Navigation**: Double-click to open source
- **Reorganization**: Drag nodes manually
- **Context Menu**: Right-click for actions