/**
 * 终端管理器 - OpenDev IDE
 * Phase 3.1: 内置终端
 * 作者: 小锤 (Hammer)
 * Phase 5.1: Bug修复
 */

const pty = require('node-pty');
const os = require('os');
const log = require('electron-log');

/**
 * 终端会话类
 */
class TerminalSession {
  constructor(id, shell, cwd) {
    this.id = id;
    // Bug修复: Windows下使用正确的shell
    this.shell = shell || (os.platform() === 'win32' ? 
      (process.env.COMSPEC || 'powershell.exe') : 
      (process.env.SHELL || '/bin/bash'));
    this.cwd = cwd || os.homedir();
    this.pty = null;
    this.dataCallback = null;
    this.exitCallback = null;
  }

  /**
   * 启动终端
   */
  start() {
    const options = {
      name: 'xterm-256color',
      cols: 80,
      rows: 30,
      cwd: this.cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color'
      }
    };

    try {
      log.info('[Terminal] 启动终端:', this.shell, this.cwd);
      this.pty = pty.spawn(this.shell, [], options);

      this.pty.onData((data) => {
        if (this.dataCallback) {
          this.dataCallback(data);
        }
      });

      this.pty.onExit(({ exitCode, signal }) => {
        if (this.exitCallback) {
          this.exitCallback(exitCode, signal);
        }
      });

      return true;
    } catch (error) {
      console.error('[TerminalSession] 启动失败:', error);
      return false;
    }
  }

  /**
   * 写入数据到终端
   */
  write(data) {
    if (this.pty) {
      this.pty.write(data);
    }
  }

  /**
   * 调整终端大小
   */
  resize(cols, rows) {
    if (this.pty) {
      this.pty.resize(cols, rows);
    }
  }

  /**
   * 设置数据回调
   */
  onData(callback) {
    this.dataCallback = callback;
  }

  /**
   * 设置退出回调
   */
  onExit(callback) {
    this.exitCallback = callback;
  }

  /**
   * 终止终端
   */
  kill() {
    if (this.pty) {
      this.pty.kill();
      this.pty = null;
    }
  }

  /**
   * 获取终端是否运行中
   */
  isRunning() {
    return this.pty !== null;
  }
}

/**
 * 终端管理器主类
 */
class TerminalManager {
  constructor() {
    this.sessions = new Map();
    this.nextId = 1;
  }

  /**
   * 创建新终端会话
   */
  create(shell, cwd) {
    const id = `term_${this.nextId++}`;
    const session = new TerminalSession(id, shell, cwd);

    session.onData((data) => {
      this.emitData(id, data);
    });

    session.onExit((exitCode, signal) => {
      this.emitExit(id, exitCode, signal);
    });

    if (session.start()) {
      this.sessions.set(id, session);
      return { success: true, id };
    }

    return { success: false, error: 'Failed to start terminal' };
  }

  /**
   * 写入数据到终端
   */
  write(id, data) {
    const session = this.sessions.get(id);
    if (session) {
      session.write(data);
      return { success: true };
    }
    return { success: false, error: 'Terminal not found' };
  }

  /**
   * 调整终端大小
   */
  resize(id, cols, rows) {
    const session = this.sessions.get(id);
    if (session) {
      session.resize(cols, rows);
      return { success: true };
    }
    return { success: false, error: 'Terminal not found' };
  }

  /**
   * 关闭终端
   */
  close(id) {
    const session = this.sessions.get(id);
    if (session) {
      session.kill();
      this.sessions.delete(id);
      return { success: true };
    }
    return { success: false, error: 'Terminal not found' };
  }

  /**
   * 获取所有终端列表
   */
  list() {
    const terminals = [];
    for (const [id, session] of this.sessions) {
      terminals.push({
        id,
        shell: session.shell,
        cwd: session.cwd,
        running: session.isRunning()
      });
    }
    return terminals;
  }

  /**
   * 事件回调存储
   */
  onDataCallbacks = new Map();
  onExitCallbacks = new Map();

  /**
   * 发送数据到渲染进程
   */
  emitData(id, data) {
    const callback = this.onDataCallbacks.get(id);
    if (callback) {
      callback(data);
    }
  }

  /**
   * 发送退出事件到渲染进程
   */
  emitExit(id, exitCode, signal) {
    const callback = this.onExitCallbacks.get(id);
    if (callback) {
      callback(exitCode, signal);
    }
    this.sessions.delete(id);
  }

  /**
   * 注册数据回调
   */
  onData(id, callback) {
    this.onDataCallbacks.set(id, callback);
  }

  /**
   * 注册退出回调
   */
  onExit(id, callback) {
    this.onExitCallbacks.set(id, callback);
  }

  /**
   * 清理回调
   */
  clearCallbacks(id) {
    this.onDataCallbacks.delete(id);
    this.onExitCallbacks.delete(id);
  }
}

module.exports = { TerminalManager, TerminalSession };
