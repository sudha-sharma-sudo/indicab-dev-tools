# IndiCab VS Code Extension - Interaction Patterns

## Project Navigator
### File Selection
- **Single Click**: Preview file in temporary tab
- **Double Click**: Open file in permanent tab
- **Right Click**: Show context menu with actions:
  - Open to Side
  - Reveal in Explorer
  - Copy Path
  - Rename
  - Delete

### Tree Navigation
- **Arrow Keys**: Move selection up/down
- **Right Arrow**: Expand collapsed node
- **Left Arrow**: Collapse expanded node
- **Enter**: Open selected file
- **Space**: Preview selected file

### Search & Filter
- **Type in Search Box**: Live filter results
- **Ctrl+F**: Focus search box
- **Esc**: Clear search

## Architecture Dashboard
### Graph Navigation
- **Click Node**: Select and show details
- **Shift+Click**: Add to selection
- **Ctrl+Click**: Toggle selection
- **Mouse Wheel**: Zoom in/out
- **Right Drag**: Pan viewport
- **Middle Drag**: Create selection box

### Node Interaction
- **Hover**: Show tooltip with metadata
- **Double Click**: Navigate to source file
- **Drag**: Reposition node (auto-snaps back)

## Common Patterns
### Keyboard Navigation
- **Tab**: Cycle through interactive elements
- **Shift+Tab**: Cycle backwards
- **Enter**: Activate focused element
- **Space**: Toggle checkboxes/buttons
- **Esc**: Close panels/cancel actions

### Drag & Drop
- **Files**: Reorganize project structure
- **Nodes**: Create manual relationships
- **Between Panels**: Transfer context

## Feedback Mechanisms
### Visual Feedback
- **Hover States**: Light background tint
- **Active States**: Darker background tint
- **Loading**: Spinner + progress bar
- **Success**: Green flash + checkmark
- **Error**: Red flash + X icon

### Audio Feedback
- **Actions**: Subtle click sounds (optional)
- **Errors**: Short error chime
- **Success**: Positive confirmation tone

## Responsive Behaviors
### Panel Resizing
- **Minimum Width**: 200px
- **Dynamic Content**:
  - Collapse secondary info
  - Stack elements vertically
  - Hide non-essential controls

### Viewport Adaptation
- **Small Screens**:
  - Single panel view
  - Compact controls
  - Larger hit targets
- **High DPI**:
  - Vector assets
  - Resolution-independent rendering