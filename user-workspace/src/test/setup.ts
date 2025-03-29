// Mock Logger module
jest.mock('../utils/Logger', () => ({
    Logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
    }
}));