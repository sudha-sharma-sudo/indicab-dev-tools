// IndiCab VS Code Extension - Design System
// Centralized design tokens and constants

export const Colors = {
  // Primary Palette
  primary: '#2E86AB',
  primaryDark: '#1D5B75',
  primaryLight: '#4FA8D3',
  
  // Secondary Palette
  secondary: '#A23B72',
  secondaryDark: '#7A2C56',
  secondaryLight: '#C94F92',
  
  // Backgrounds
  background: '#1E1E1E',
  panel: '#252526',
  widget: '#2D2D2D',
  hover: '#2A2D2E',
  active: '#37373D',
  
  // Text
  textPrimary: '#D4D4D4',
  textSecondary: '#858585',
  textDisabled: '#5A5A5A',
  
  // Status
  success: '#608B4E',
  warning: '#DCDC7A',
  error: '#F44747',
  info: '#569CD6',
  
  // File Type Colors
  class: '#4EC9B0',
  interface: '#B5CEA8',
  test: '#F44747',
  config: '#DCDCAA',
  resource: '#9CDCFE',
  
  // Spring Components
  springController: '#4299E1',
  springService: '#48BB78',
  springRepository: '#9F7AEA',
  
  // Graph Relationships
  edgeDependency: '#569CD6',
  edgeInheritance: '#4EC9B0',
  edgeImplementation: '#C586C0'
};

export const Typography = {
  fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  codeFont: "'Consolas', 'Courier New', monospace",
  
  sizes: {
    body: '13px',
    h1: '20px',
    h2: '16px',
    h3: '13px',
    code: '12px'
  },
  
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600
  }
};

export const Spacing = {
  baseUnit: '4px',
  small: '4px',
  medium: '8px',
  large: '12px',
  xlarge: '16px'
};

export const Icons = {
  sizes: {
    small: '12px',
    medium: '16px',
    large: '24px'
  },
  types: {
    class: 'java-class',
    interface: 'interface',
    test: 'test',
    spring: 'spring',
    resource: 'resource',
    controller: 'controller',
    service: 'service',
    repository: 'repository'
  }
};

export const Effects = {
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.3)',
    medium: '0 2px 6px rgba(0, 0, 0, 0.3)',
    large: '0 4px 12px rgba(0, 0, 0, 0.3)'
  },
  borders: {
    width: '1px',
    radius: '3px',
    color: '#3C3C3C'
  }
};

export const Motion = {
  duration: {
    fast: '100ms',
    medium: '200ms',
    slow: '300ms'
  },
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
};

// Accessibility constants
export const A11y = {
  minContrast: 4.5,
  largeTextContrast: 3,
  uiComponentContrast: 3,
  focusOutline: '2px solid #2E86AB',
  focusOffset: '1px'
};

// Component-specific tokens
export const Components = {
  projectNavigator: {
    indentSize: '16px',
    rowHeight: '22px',
    iconSize: '16px'
  },
  architectureDashboard: {
    nodeSizes: {
      class: '24px',
      interface: '20px',
      test: '20px',
      config: '20px'
    },
    edgeWidth: '1.5px'
  }
};