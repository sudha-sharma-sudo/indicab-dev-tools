# IndiCab VS Code Extension - Accessibility Guidelines

## WCAG 2.1 AA Compliance

### Perceivable
1. **Text Alternatives**
   - All icons have ARIA labels
   - Images have alt text
   - Decorative elements marked as presentation

2. **Adaptable Content**
   - Works in high contrast mode
   - Supports text resizing (200%)
   - Content reflows properly

3. **Distinguishable**
   - Minimum color contrast ratio of 4.5:1
   - Text spacing adjustable
   - No color as sole information carrier

### Operable
1. **Keyboard Accessible**
   - All functionality available via keyboard
   - No keyboard traps
   - Logical tab order

2. **Enough Time**
   - Adjustable timeouts
   - Pause/stop animations
   - Session saving

3. **Seizures & Physical Reactions**
   - No flashing >3 times/second
   - Motion animation optional

4. **Navigable**
   - Clear headings and labels
   - Focus visible at all times
   - Skip to content links

### Understandable
1. **Readable**
   - Language defined in HTML
   - Unusual words explained
   - Abbreviations expanded

2. **Predictable**
   - Consistent navigation
   - No unexpected changes
   - Error prevention

3. **Input Assistance**
   - Clear error messages
   - Labels and instructions
   - Suggestions for corrections

### Robust
1. **Compatible**
   - Works with assistive tech
   - Valid markup
   - Proper name, role, value

## Implementation Details

### Screen Reader Support
- **ARIA Attributes**:
  - `aria-label` for all interactive elements
  - `aria-expanded` for collapsible sections
  - `aria-live` for dynamic content

- **Focus Management**:
  - Logical tab order
  - Programmatic focus control
  - Keyboard traps prevented

### Keyboard Navigation
1. **Project Navigator**
   - Arrow keys: Navigate tree
   - Enter: Open file
   - Space: Preview file
   - Tab: Move to next control

2. **Architecture Dashboard**
   - Tab: Cycle through nodes
   - Enter: Select node
   - Arrow keys: Move selected node

### Visual Considerations
- **High Contrast Mode**:
  - Special styling for Windows HC themes
  - Alternative icon set
  - Increased border widths

- **Color Blindness**:
  - Patterns supplement colors
  - Text labels for color-coded items
  - Multiple visual cues

### Testing Protocol
1. **Automated Tests**
   - axe-core integration
   - Color contrast verification
   - ARIA attribute validation

2. **Manual Tests**
   - Screen reader navigation
   - Keyboard-only operation
   - Zoom/magnification

3. **User Testing**
   - Participants with disabilities
   - Assistive technology users
   - Various input methods

## Maintenance
- **Quarterly Audits**
- **User Feedback Integration**
- **Continuous Improvement Process**