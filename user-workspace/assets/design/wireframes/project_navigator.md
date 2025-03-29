# Project Navigator Wireframe

## Structure
```plaintext
[IndiCab Project Navigator]
├── [Search Bar]
│   └── [X] Clear button
│   └── [⌄] Filter dropdown
├── [Project Tree]
│   ├── [▸] com.example (root package)
│   │   ├── [▸] config
│   │   │   ├── [⚙] AppConfig.java
│   │   │   └── [⚙] SecurityConfig.java
│   │   ├── [▸] controller
│   │   │   ├── [C] UserController.java
│   │   │   └── [C] AuthController.java
│   │   ├── [▸] service
│   │   │   ├── [I] UserService.java (interface)
│   │   │   └── [C] UserServiceImpl.java
│   │   └── [T] UserServiceTest.java
│   └── [▸] resources
│       └── [📄] application.properties
└── [Status Bar]
    ├── [📦] Package: com.example.controller
    ├── [⚡] Analysis: 85% complete
    └── [🔍] [🔄] [⚙] Action buttons
```

## Key Elements
1. **Search Bar**
   - Live filtering of tree
   - Type filters (Class/Interface/Test/Config)
   - Clear search functionality

2. **Project Tree**
   - Color-coded file types:
     - [C] Class: #4EC9B0
     - [I] Interface: #B5CEA8  
     - [T] Test: #F44747
     - [⚙] Config: #DCDCAA
     - [📄] Resource: #9CDCFE
   - Expandable/collapsible nodes
   - Context menu on right-click

3. **Status Bar**
   - Current package context
   - Analysis progress
   - Quick action buttons:
     - Search (🔍)
     - Refresh (🔄)
     - Settings (⚙)

## Interactive Behaviors
- Hover: Highlight row (#252526)
- Selection: Blue accent (#2E86AB)
- Drag handles for reorganization
- Animated expand/collapse