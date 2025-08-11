/**
 * Jest测试环境设置
 */

// Mock console方法以避免测试输出过多日志
const originalConsole = { ...console };

beforeEach(() => {
    // 可以选择性地mock console方法
    // console.log = jest.fn();
    // console.warn = jest.fn();
    // console.error = jest.fn();
});

afterEach(() => {
    // 恢复console
    Object.assign(console, originalConsole);
    
    // 清理所有mocks
    jest.clearAllMocks();
});

// 全局测试配置
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;