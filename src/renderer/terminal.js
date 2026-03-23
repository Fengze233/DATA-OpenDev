/**
 * 终端前端控制器 - OpenDev IDE
 * Phase 3.1: 内置终端
 * 作者: 小锤 (Hammer)
 */

// 终端状态
let terminals = new Map();
let activeTerminalId = null;
let commandHistory = [];
let historyIndex = -1;

// DOM 元素
let terminalContainer = null;
let terminalTabs = null;
let terminalPanel = null;

/**
 * 初始化终端系统
 */
function initTerminal() {
  terminalContainer = document.getElementById('terminal-container');
  terminalTabs = document.getElementById('terminal-tabs');
  terminalPanel = document.getElementById('terminal-panel');

  if (!terminalContainer || !terminalTabs || !terminalPanel) {
    console.warn('[Terminal] DOM 元素未找到');
    return;
  }

  console.log('[Terminal] 终端系统初始化完成');
}

/**
 * 创建新终端
 */
async function createTerminal() {
  try {
    const result = await window.electronAPI.terminal.create();
    
    if (result.success) {
      const termId = result.id;
      
      // 创建 xterm 实例
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#cccccc',
          cursor: '#ffffff',
          selection: '#264f78'
        },
        rows: 24,
        cols: 80
      });

      // 创建 fit 适配器
      const fitAddon = new FitAddon.FitAddon();
      term.loadAddon(fitAddon);

      // 存储终端实例
      terminals.set(termId, { term, fitAddon, container: null });

      // 渲染终端
      const termDiv = document.createElement('div');
      termDiv.className = 'terminal-instance';
      termDiv.style.width = '100%';
      termDiv.style.height = '100%';
      termDiv.style.display = 'none';
      termDiv.id = `terminal-instance-${termId}`;
      terminalPanel.appendChild(termDiv);

      term.open(termDiv);
      fitAddon.fit();

      // 终端输入事件
      term.onData((data) => {
        window.electronAPI.terminal.write(termId, data);
      });

      // 数据回调
      window.electronAPI.terminal.onData(termId, (data) => {
        term.write(data);
      });

      // 退出回调
      window.electronAPI.terminal.onExit(termId, (exitCode, signal) => {
        term.write(`\r\n[进程已退出，退出码: ${exitCode}]\r\n`);
      });

      // 创建标签页
      createTerminalTab(termId);

      // 激活新终端
      switchTerminal(termId);

      // 监听窗口大小变化
      window.addEventListener('resize', () => {
        const t = terminals.get(termId);
        if (t && t.fitAddon) {
          t.fitAddon.fit();
          window.electronAPI.terminal.resize(termId, t.term.cols, t.term.rows);
        }
      });

      return { success: true, id: termId };
    }

    return result;
  } catch (error) {
    console.error('[Terminal] 创建失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 创建终端标签页
 */
function createTerminalTab(termId) {
  const tab = document.createElement('div');
  tab.className = 'terminal-tab';
  tab.dataset.termId = termId;
  tab.innerHTML = `
    <span>终端 ${termId.replace('term_', '')}</span>
    <button class="terminal-tab-close" data-term-id="${termId}">×</button>
  `;

  // 点击切换终端
  tab.addEventListener('click', (e) => {
    if (!e.target.classList.contains('terminal-tab-close')) {
      switchTerminal(termId);
    }
  });

  // 关闭按钮
  tab.querySelector('.terminal-tab-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeTerminal(termId);
  });

  terminalTabs.appendChild(tab);
}

/**
 * 切换终端
 */
function switchTerminal(termId) {
  // 隐藏所有终端
  terminals.forEach((t, id) => {
    if (t.container) {
      t.container.style.display = 'none';
    } else {
      const el = document.getElementById(`terminal-instance-${id}`);
      if (el) el.style.display = 'none';
    }
  });

  // 取消所有标签激活状态
  document.querySelectorAll('.terminal-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  // 显示选中的终端
  const t = terminals.get(termId);
  if (t) {
    if (!t.container) {
      t.container = document.getElementById(`terminal-instance-${termId}`);
    }
    if (t.container) {
      t.container.style.display = 'block';
    }
    // 重新fit
    if (t.fitAddon) {
      t.fitAddon.fit();
      window.electronAPI.terminal.resize(termId, t.term.cols, t.term.rows);
    }
  }

  // 激活标签
  const tab = document.querySelector(`.terminal-tab[data-term-id="${termId}"]`);
  if (tab) {
    tab.classList.add('active');
  }

  activeTerminalId = termId;
}

/**
 * 关闭终端
 */
async function closeTerminal(termId) {
  try {
    await window.electronAPI.terminal.close(termId);

    // 移除终端实例
    const t = terminals.get(termId);
    if (t) {
      t.term.dispose();
      if (t.container) {
        t.container.remove();
      }
      terminals.delete(termId);
    }

    // 移除标签
    const tab = document.querySelector(`.terminal-tab[data-term-id="${termId}"]`);
    if (tab) {
      tab.remove();
    }

    // 如果关闭的是当前激活的终端，切换到其他终端
    if (activeTerminalId === termId) {
      const remaining = terminals.keys().next().value;
      if (remaining) {
        switchTerminal(remaining);
      } else {
        terminalPanel.style.display = 'none';
      }
    }

  } catch (error) {
    console.error('[Terminal] 关闭失败:', error);
  }
}

/**
 * 获取当前终端
 */
function getActiveTerminal() {
  return activeTerminalId;
}

/**
 * 获取历史命令
 */
function getCommandHistory() {
  return commandHistory;
}

/**
 * 添加到命令历史
 */
function addToHistory(command) {
  if (command && command.trim() && !commandHistory.includes(command)) {
    commandHistory.push(command);
    historyIndex = commandHistory.length;
  }
}

/**
 * 获取上一条命令
 */
function getPrevCommand() {
  if (historyIndex > 0) {
    historyIndex--;
    return commandHistory[historyIndex];
  }
  return '';
}

/**
 * 获取下一条命令
 */
function getNextCommand() {
  if (historyIndex < commandHistory.length - 1) {
    historyIndex++;
    return commandHistory[historyIndex];
  }
  return '';
}

// 导出到全局
window.terminal = {
  init: initTerminal,
  create: createTerminal,
  close: closeTerminal,
  switch: switchTerminal,
  getActive: getActiveTerminal,
  getHistory: getCommandHistory,
  addHistory: addToHistory,
  getPrev: getPrevCommand,
  getNext: getNextCommand
};
