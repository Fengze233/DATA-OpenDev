/**
 * 调试管理器 - OpenDev IDE
 * Phase 3.3: 调试支持
 * 作者: 小锤 (Hammer)
 */

const net = require('net');
const { spawn } = require('child_process');
const path = require('path');

/**
 * 调试会话类
 */
class DebugSession {
  constructor(id, config) {
    this.id = id;
    this.config = config || {};
    this.state = 'stopped'; // stopped, running, paused, terminated
    this.breakpoints = new Map(); // file -> line[]
    this.threadId = null;
    this.frameId = null;
    this.variables = [];
    this.callStack = [];
    this.client = null;
    this.adapterProcess = null;
  }

  /**
   * 启动调试适配器
   */
  async start() {
    const { type, runtime, program } = this.config;
    
    try {
      // 根据调试类型启动适配器
      if (runtime === 'node') {
        // Node.js 调试
        return await this.startNodeDebug(program);
      } else if (runtime === 'browser') {
        // 浏览器调试（需要 Chrome DevTools）
        return await this.startChromeDebug(program);
      }
      
      return { success: false, error: 'Unsupported runtime: ' + runtime };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 启动 Node.js 调试
   */
  async startNodeDebug(program) {
    return new Promise((resolve) => {
      // 使用 Node.js 内置调试器
      this.adapterProcess = spawn('node', [
        '--inspect-brk=' + (this.config.port || 9229),
        program
      ], {
        cwd: this.config.cwd || process.cwd(),
        env: { ...process.env, DEBUG: 'true' }
      });

      this.adapterProcess.stdout.on('data', (data) => {
        console.log('[Debug] stdout:', data.toString());
      });

      this.adapterProcess.stderr.on('data', (data) => {
        console.log('[Debug] stderr:', data.toString());
      });

      this.adapterProcess.on('error', (err) => {
        console.error('[Debug] Process error:', err);
        this.state = 'terminated';
      });

      this.adapterProcess.on('exit', (code) => {
        this.state = 'terminated';
      });

      // 等待调试器启动
      setTimeout(() => {
        this.state = 'paused';
        resolve({ success: true, port: this.config.port || 9229 });
      }, 1000);
    });
  }

  /**
   * 启动 Chrome 调试（占位）
   */
  async startChromeDebug(program) {
    // Chrome 调试需要 chrome-remote-interface 或类似库
    return { success: false, error: 'Chrome debugging not implemented yet' };
  }

  /**
   * 设置断点
   */
  setBreakpoint(file, line) {
    if (!this.breakpoints.has(file)) {
      this.breakpoints.set(file, []);
    }
    const lines = this.breakpoints.get(file);
    if (!lines.includes(line)) {
      lines.push(line);
    }
    return { success: true, breakpoints: this.breakpoints };
  }

  /**
   * 删除断点
   */
  deleteBreakpoint(file, line) {
    const lines = this.breakpoints.get(file);
    if (lines) {
      const index = lines.indexOf(line);
      if (index > -1) {
        lines.splice(index, 1);
      }
    }
    return { success: true, breakpoints: this.breakpoints };
  }

  /**
   * 获取所有断点
   */
  getBreakpoints() {
    const result = [];
    for (const [file, lines] of this.breakpoints) {
      result.push({ file, lines });
    }
    return result;
  }

  /**
   * 继续执行
   */
  continue() {
    this.state = 'running';
    return { success: true, state: this.state };
  }

  /**
   * 暂停
   */
  pause() {
    this.state = 'paused';
    return { success: true, state: this.state };
  }

  /**
   * 单步进入
   */
  stepIn() {
    this.state = 'paused';
    return { success: true, state: this.state };
  }

  /**
   * 单步跳过
   */
  stepOver() {
    this.state = 'paused';
    return { success: true, state: this.state };
  }

  /**
   * 单步退出
   */
  stepOut() {
    this.state = 'paused';
    return { success: true, state: this.state };
  }

  /**
   * 获取调用堆栈
   */
  getStack() {
    // 模拟调用堆栈数据
    return [
      { id: 1, name: 'module.js', source: '/path/to/module.js', line: 10, column: 5 },
      { id: 2, name: 'index.js', source: '/path/to/index.js', line: 5, column: 3 }
    ];
  }

  /**
   * 获取变量
   */
  getVariables(scope = 'local') {
    // 模拟变量数据
    if (scope === 'local') {
      return [
        { name: 'i', value: '0', type: 'number' },
        { name: 'arr', value: '[1, 2, 3]', type: 'array' },
        { name: 'fn', value: 'function() {}', type: 'function' }
      ];
    } else if (scope === 'global') {
      return [
        { name: 'console', value: 'Console', type: 'object' },
        { name: 'process', value: 'Process', type: 'object' }
      ];
    }
    return [];
  }

  /**
   * 评估表达式
   */
  evaluate(expr) {
    try {
      // 注意：这里需要安全地评估表达式
      const result = eval('(' + expr + ')'); // 简化实现
      return { success: true, result: String(result) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 停止调试
   */
  stop() {
    if (this.adapterProcess) {
      this.adapterProcess.kill();
      this.adapterProcess = null;
    }
    this.state = 'terminated';
    return { success: true };
  }
}

/**
 * 调试管理器主类
 */
class DebugManager {
  constructor() {
    this.sessions = new Map();
    this.nextId = 1;
    this.currentSession = null;
  }

  /**
   * 创建调试会话
   */
  createDebugSession(config) {
    const id = `debug_${this.nextId++}`;
    const session = new DebugSession(id, config);
    this.sessions.set(id, session);
    this.currentSession = id;
    return { success: true, id, session };
  }

  /**
   * 启动调试
   */
  async startDebug(id) {
    const session = this.sessions.get(id);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }
    return await session.start();
  }

  /**
   * 设置断点
   */
  setBreakpoint(sessionId, file, line) {
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.setBreakpoint(file, line);
    }
    return { success: false, error: 'Session not found' };
  }

  /**
   * 删除断点
   */
  deleteBreakpoint(sessionId, file, line) {
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.deleteBreakpoint(file, line);
    }
    return { success: false, error: 'Session not found' };
  }

  /**
   * 获取断点
   */
  getBreakpoints(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.getBreakpoints();
    }
    return [];
  }

  /**
   * 继续执行
   */
  continue(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.continue();
    }
    return { success: false, error: 'Session not found' };
  }

  /**
   * 暂停
   */
  pause(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.pause();
    }
    return { success: false, error: 'Session not found' };
  }

  /**
   * 单步进入
   */
  stepIn(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.stepIn();
    }
    return { success: false, error: 'Session not found' };
  }

  /**
   * 单步跳过
   */
  stepOver(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.stepOver();
    }
    return { success: false, error: 'Session not found' };
  }

  /**
   * 单步退出
   */
  stepOut(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.stepOut();
    }
    return { success: false, error: 'Session not found' };
  }

  /**
   * 获取调用堆栈
   */
  getStack(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.getStack();
    }
    return [];
  }

  /**
   * 获取变量
   */
  getVariables(sessionId, scope) {
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.getVariables(scope);
    }
    return [];
  }

  /**
   * 评估表达式
   */
  evaluate(sessionId, expr) {
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.evaluate(expr);
    }
    return { success: false, error: 'Session not found' };
  }

  /**
   * 停止调试
   */
  stopDebug(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.stop();
      this.sessions.delete(sessionId);
      if (this.currentSession === sessionId) {
        this.currentSession = null;
      }
      return { success: true };
    }
    return { success: false, error: 'Session not found' };
  }

  /**
   * 获取会话列表
   */
  listSessions() {
    return Array.from(this.sessions.values()).map(s => ({
      id: s.id,
      state: s.state,
      config: s.config
    }));
  }

  /**
   * 获取当前会话
   */
  getCurrentSession() {
    return this.currentSession;
  }
}

module.exports = { DebugManager, DebugSession };
