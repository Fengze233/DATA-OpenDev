/**
 * 稳定性优化模块 - OpenDev IDE
 * 阶段 5.2: 稳定性优化
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * 稳定性管理器
 */
class StabilityManager {
  constructor(options = {}) {
    this.logPath = options.logPath || app.getPath('userData');
    this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024; // 10MB
    this.maxLogFiles = options.maxLogFiles || 5;
    this.crashReportsPath = path.join(this.logPath, 'crash-reports');
    
    this._ensureDirs();
    this._initErrorHandlers();
  }

  /**
   * 确保目录存在
   */
  _ensureDirs() {
    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath, { recursive: true });
    }
    if (!fs.existsSync(this.crashReportsPath)) {
      fs.mkdirSync(this.crashReportsPath, { recursive: true });
    }
  }

  /**
   * 初始化错误处理器
   */
  _initErrorHandlers() {
    // 未捕获的异常
    process.on('uncaughtException', (error) => {
      this.handleError(error, 'uncaughtException');
    });

    // 未处理的 Promise 拒绝
    process.on('unhandledRejection', (reason, promise) => {
      this.handleError(new Error(String(reason)), 'unhandledRejection');
    });
  }

  /**
   * 处理错误
   */
  handleError(error, type = 'error') {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      type,
      message: error.message || String(error),
      stack: error.stack || '',
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      appVersion: app.getVersion()
    };

    // 写入日志
    this.writeLog(errorInfo);

    // 写入崩溃报告
    this.writeCrashReport(errorInfo);

    // 控制台输出
    console.error(`[Stability] ${type}:`, error.message);
  }

  /**
   * 写入日志
   */
  writeLog(info) {
    try {
      const logFile = path.join(this.logPath, `opendev-${this._getDateString()}.log`);
      const logEntry = JSON.stringify(info) + '\n';
      
      // 检查文件大小
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        if (stats.size > this.maxLogSize) {
          this._rotateLogs();
        }
      }
      
      fs.appendFileSync(logFile, logEntry, 'utf-8');
    } catch (e) {
      console.error('[Stability] Write log failed:', e.message);
    }
  }

  /**
   * 写入崩溃报告
   */
  writeCrashReport(info) {
    try {
      const filename = `crash-${Date.now()}.json`;
      const crashFile = path.join(this.crashReportsPath, filename);
      fs.writeFileSync(crashFile, JSON.stringify(info, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Stability] Write crash report failed:', e.message);
    }
  }

  /**
   * 日志轮转
   */
  _rotateLogs() {
    try {
      const dateStr = this._getDateString();
      
      // 删除最旧的日志
      for (let i = this.maxLogFiles; i > 0; i--) {
        const oldFile = path.join(this.logPath, `opendev-${dateStr}-${i}.log`);
        if (fs.existsSync(oldFile)) {
          fs.unlinkSync(oldFile);
        }
      }
      
      // 移动当前日志
      const currentFile = path.join(this.logPath, `opendev-${dateStr}.log`);
      if (fs.existsSync(currentFile)) {
        fs.renameSync(currentFile, path.join(this.logPath, `opendev-${dateStr}-1.log`));
      }
    } catch (e) {
      console.error('[Stability] Rotate logs failed:', e.message);
    }
  }

  /**
   * 获取日期字符串
   */
  _getDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  /**
   * 获取日志
   */
  getLogs(days = 1) {
    const logs = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const logFile = path.join(this.logPath, `opendev-${dateStr}.log`);
      
      if (fs.existsSync(logFile)) {
        try {
          const content = fs.readFileSync(logFile, 'utf-8');
          logs.push(...content.split('\n').filter(line => line).map(line => {
            try {
              return JSON.parse(line);
            } catch {
              return { message: line };
            }
          }));
        } catch (e) {
          // 忽略读取错误
        }
      }
    }
    
    return logs;
  }

  /**
   * 获取崩溃报告
   */
  getCrashReports() {
    const reports = [];
    
    try {
      const files = fs.readdirSync(this.crashReportsPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = fs.readFileSync(path.join(this.crashReportsPath, file), 'utf-8');
          reports.push(JSON.parse(content));
        }
      }
    } catch (e) {
      // 忽略
    }
    
    return reports;
  }

  /**
   * 清理旧日志
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30天
    
    try {
      const files = fs.readdirSync(this.logPath);
      for (const file of files) {
        if (file.startsWith('opendev-') && file.endsWith('.log')) {
          const filePath = path.join(this.logPath, file);
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (e) {
      // 忽略
    }
  }

  /**
   * 性能监控
   */
  getPerformanceMetrics() {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    
    return {
      memory: {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + ' MB',
        rss: Math.round(mem.rss / 1024 / 1024) + ' MB',
        external: Math.round(mem.external / 1024 / 1024) + ' MB'
      },
      cpu: {
        user: cpu.user,
        system: cpu.system
      },
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version
    };
  }
}

/**
 * 性能监控装饰器
 */
function performanceMonitor(fn, name = 'function') {
  return function(...args) {
    const start = Date.now();
    const result = fn.apply(this, args);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn(`[Performance] ${name} took ${duration}ms`);
    }
    
    return result;
  };
}

/**
 * 异步性能监控
 */
async function asyncPerformanceMonitor(fn, name = 'asyncFunction') {
  return async function(...args) {
    const start = Date.now();
    try {
      const result = await fn.apply(this, args);
      const duration = Date.now() - start;
      
      if (duration > 3000) {
        console.warn(`[Performance] ${name} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[Performance] ${name} failed after ${duration}ms:`, error.message);
      throw error;
    }
  };
}

module.exports = { StabilityManager, performanceMonitor, asyncPerformanceMonitor };
