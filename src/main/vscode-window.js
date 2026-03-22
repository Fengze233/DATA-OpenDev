/**
 * VSCode Window API - OpenDev IDE
 * 实现 vscode.window 子集
 */

/**
 * QuickPick 项
 */
class QuickPickItem {
  constructor(label, description = '', detail = '') {
    this.label = label;
    this.description = description;
    this.detail = detail;
  }
}

/**
 * QuickPick 选项
 */
class QuickPickOptions {
  constructor(options = {}) {
    this.canPickMany = options.canPickMany || false;
    this.placeHolder = options.placeHolder || '';
    this.matchOnDescription = options.matchOnDescription !== false;
    this.matchOnDetail = options.matchOnDetail !== false;
    this.activeItems = options.activeItems || [];
    this.onDidSelectItem = options.onDidSelectItem || null;
  }
}

/**
 * InputBox 选项
 */
class InputBoxOptions {
  constructor(options = {}) {
    this.value = options.value || '';
    this.valueSelection = options.valueSelection || null;
    this.prompt = options.prompt || '';
    this.password = options.password || false;
    this.placeHolder = options.placeHolder || '';
    this.validateInput = options.validateInput || null;
  }
}

/**
 * MessageBox 选项
 */
class MessageBoxOptions {
  constructor(options = {}) {
    this.type = options.type || 'info'; // info, warning, error, question
    this.buttons = options.buttons || ['OK'];
    this.defaultId = options.defaultId || 0;
    this.cancelId = options.cancelId || -1;
    this.modal = options.modal || false;
  }
}

/**
 * 创建 window 模块
 */
function create(vscode) {
  const windowApi = {
    _context: null,
    _activeTextEditor: null,
    _visibleTextEditors: [],
    
    /**
     * 显示信息消息
     * vscode.window.showInformationMessage(message, ...actions)
     */
    showInformationMessage(message, ...actions) {
      return this._showMessage('info', message, actions);
    },
    
    /**
     * 显示警告消息
     * vscode.window.showWarningMessage(message, ...actions)
     */
    showWarningMessage(message, ...actions) {
      return this._showMessage('warning', message, actions);
    },
    
    /**
     * 显示错误消息
     * vscode.window.showErrorMessage(message, ...actions)
     */
    showErrorMessage(message, ...actions) {
      return this._showMessage('error', message, actions);
    },
    
    /**
     * 内部显示消息方法
     */
    _showMessage(type, message, actions = []) {
      // 通过事件系统触发UI显示
      if (this._context && this._context.events) {
        this._context.events.emit('window:showMessage', {
          type,
          message,
          actions
        });
      }
      
      // 返回 Promise
      return new Promise((resolve) => {
        if (actions.length === 0) {
          resolve(undefined);
        } else {
          // 默认选择第一个action
          resolve(actions[0]);
        }
      });
    },
    
    /**
     * 显示确认对话框
     * vscode.window.showInformationMessage(message, options, ...actions)
     */
    showInformationMessageWithOptions(message, options = {}, ...actions) {
      return this._showMessageWithOptions('info', message, options, actions);
    },
    
    /**
     * 显示警告确认对话框
     */
    showWarningMessageWithOptions(message, options = {}, ...actions) {
      return this._showMessageWithOptions('warning', message, options, actions);
    },
    
    /**
     * 显示错误确认对话框
     */
    showErrorMessageWithOptions(message, options = {}, ...actions) {
      return this._showMessageWithOptions('error', message, options, actions);
    },
    
    /**
     * 内部显示带选项的消息
     */
    _showMessageWithOptions(type, message, options, actions = []) {
      const fullOptions = new MessageBoxOptions({
        ...options,
        buttons: options.buttons || actions
      });
      
      if (this._context && this._context.events) {
        this._context.events.emit('window:showMessageWithOptions', {
          type,
          message,
          options: fullOptions
        });
      }
      
      return Promise.resolve(undefined);
    },
    
    /**
     * 显示快速选择
     * vscode.window.showQuickPick(items, options)
     */
    showQuickPick(items, options = {}) {
      const opts = options instanceof QuickPickOptions ? options : new QuickPickOptions(options);
      
      if (this._context && this._context.events) {
        this._context.events.emit('window:showQuickPick', {
          items,
          options: opts
        });
      }
      
      // 返回 Promise
      return new Promise((resolve) => {
        if (opts.canPickMany) {
          resolve([]);
        } else {
          if (Array.isArray(items) && items.length > 0) {
            // 默认返回第一个
            resolve(items[0]);
          } else {
            resolve(undefined);
          }
        }
      });
    },
    
    /**
     * 显示输入框
     * vscode.window.showInputBox(options)
     */
    showInputBox(options = {}) {
      const opts = options instanceof InputBoxOptions ? options : new InputBoxOptions(options);
      
      if (this._context && this._context.events) {
        this._context.events.emit('window:showInputBox', {
          options: opts
        });
      }
      
      return Promise.resolve(opts.value);
    },
    
    /**
     * 获取活动编辑器
     * vscode.window.activeTextEditor
     */
    get activeTextEditor() {
      return this._activeTextEditor;
    },
    
    /**
     * 设置活动编辑器
     */
    setActiveTextEditor(editor) {
      this._activeTextEditor = editor;
      if (this._context && this._context.events) {
        this._context.events.emit('window:activeTextEditorChanged', editor);
      }
    },
    
    /**
     * 获取可见编辑器列表
     * vscode.window.visibleTextEditors
     */
    get visibleTextEditors() {
      return this._visibleTextEditors;
    },
    
    /**
     * 打开文本编辑器
     * vscode.window.showTextDocument(document, options)
     */
    showTextDocument(document, options = {}) {
      return new Promise((resolve, reject) => {
        // 触发打开文档事件
        if (this._context && this._context.events) {
          this._context.events.emit('window:showTextDocument', {
            document,
            options
          });
        }
        
        // 返回编辑器对象
        const editor = {
          document,
          options,
          // 编辑器视图状态
          viewColumn: options.viewColumn || 1,
          // 可见区域
          visible: true,
          
          // 编辑器操作
          edit: (callback) => {
            return new Promise((editResolve, editReject) => {
              const builder = {
                replace: (range, text) => {
                  // 简单实现：替换整个文档
                  document.setText(text);
                },
                insert: (position, text) => {
                  const current = document.getText();
                  document.setText(current.slice(0, position) + text + current.slice(position));
                },
                delete: (range) => {
                  document.setText('');
                }
              };
              
              try {
                callback(builder);
                editResolve(true);
              } catch (e) {
                editReject(e);
              }
            });
          },
          
          // 设置视图区域
          revealRange: (range, revealType = 5) => {
            // Center, CenterScroll, Absolute, AbsoluteInCenter, Minimal
            if (this._context && this._context.events) {
              this._context.events.emit('window:revealRange', { range, revealType });
            }
          },
          
          // 获取选区
          get selection() {
            return {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 0 },
              isEmpty: true
            };
          },
          
          // 设置选区
          setSelection: (selection) => {
            if (this._context && this._context.events) {
              this._context.events.emit('window:setSelection', { selection });
            }
          }
        };
        
        // 更新可见编辑器列表
        this._visibleTextEditors.push(editor);
        this._activeTextEditor = editor;
        
        resolve(editor);
      });
    },
    
    /**
     * 创建终端
     * vscode.window.createTerminal(options)
     */
    createTerminal(options = {}) {
      const terminal = {
        name: options.name || 'OpenDev Terminal',
        processId: null,
        exitStatus: null,
        creationOptions: options,
        
        // 显示终端
        show: (preserveFocus = true) => {
          if (this._context && this._context.events) {
            this._context.events.emit('window:terminalShow', { terminal, preserveFocus });
          }
        },
        
        // 隐藏终端
        hide: () => {
          if (this._context && this._context.events) {
            this._context.events.emit('window:terminalHide', { terminal });
          }
        },
        
        // 发送文本到终端
        sendText: (text, addNewLine = true) => {
          if (this._context && this._context.events) {
            this._context.events.emit('window:terminalSendText', { terminal, text, addNewLine });
          }
        },
        
        // 释放终端
        dispose: () => {
          if (this._context && this._context.events) {
            this._context.events.emit('window:terminalDispose', { terminal });
          }
        }
      };
      
      return terminal;
    },
    
    /**
     * 获取终端列表
     * vscode.window.terminals
     */
    get terminals() {
      return this._context ? this._context.terminals || [] : [];
    },
    
    /**
     * 创建状态栏项
     * vscode.window.createStatusBarItem(id, priority)
     */
    createStatusBarItem(id = '', priority = 0) {
      const statusBarItem = {
        id: id || `statusbar-${Date.now()}`,
        text: '',
        tooltip: '',
        color: undefined,
        backgroundColor: undefined,
        command: undefined,
        alignment: 1, // Left = 1, Right = 2
        priority: priority,
        show: () => {
          if (this._context && this._context.events) {
            this._context.events.emit('window:statusBarShow', { item: statusBarItem });
          }
        },
        hide: () => {
          if (this._context && this._context.events) {
            this._context.events.emit('window:statusBarHide', { item: statusBarItem });
          }
        },
        dispose: () => {
          statusBarItem.hide();
        }
      };
      
      return statusBarItem;
    },
    
    /**
     * 创建Webview
     * vscode.window.createWebviewPanel(viewType, title, showOptions, options)
     */
    createWebviewPanel(viewType, title, showOptions = {}, options = {}) {
      const panel = {
        viewType,
        title,
        showOptions: showOptions || { viewColumn: 1, preserveFocus: false },
        options,
        
        // Webview内容
        html: '',
        options2: options,
        
        // Webview 消息 API
        webview: {
          postMessage: (message) => {
            if (this._context && this._context.events) {
              this._context.events.emit('window:webviewPostMessage', { panel, message });
            }
            return Promise.resolve(true);
          },
          onDidReceiveMessage: (callback) => {
            if (this._context && this._context.events) {
              return this._context.events.on('window:webviewMessage', ({ panel: p, message }) => {
                if (p === panel) callback(message);
              });
            }
            return { dispose: () => {} };
          },
          options: options.webviewOptions || {}
        },
        
        // 消息传递
        postMessage: (message) => {
          if (this._context && this._context.events) {
            this._context.events.emit('window:webviewPostMessage', { panel, message });
          }
          return Promise.resolve(true);
        },
        
        // 事件
        onDidChangeViewState: (callback) => {
          if (this._context && this._context.events) {
            return this._context.events.on('window:webviewViewStateChanged', callback);
          }
          return { dispose: () => {} };
        },
        
        onDidDispose: (callback) => {
          if (this._context && this._context.events) {
            return this._context.events.on('window:webviewDisposed', callback);
          }
          return { dispose: () => {} };
        },
        
        // 显示/隐藏
        reveal: (viewColumn = 1, preserveFocus = true) => {
          if (this._context && this._context.events) {
            this._context.events.emit('window:webviewReveal', { panel, viewColumn, preserveFocus });
          }
        },
        
        dispose: () => {
          if (this._context && this._context.events) {
            this._context.events.emit('window:webviewDisposed', { panel });
          }
        }
      };
      
      return panel;
    },
    
    /**
     * 显示进度
     * vscode.window.withProgress(options, task)
     */
    withProgress(options, task) {
      const progressOptions = {
        location: options.location || { viewId: 'window' },
        title: options.title || '',
        cancellable: options.cancellable || false
      };
      
      // 通知UI开始显示进度
      if (this._context && this._context.events) {
        this._context.events.emit('window:progressStart', progressOptions);
      }
      
      // 创建进度报告器
      const progress = {
        report: (value) => {
          if (this._context && this._context.events) {
            this._context.events.emit('window:progressReport', { ...progressOptions, value });
          }
        }
      };
      
      // 执行任务
      return task(progress).finally(() => {
        if (this._context && this._context.events) {
          this._context.events.emit('window:progressDone', progressOptions);
        }
      });
    },
    
    /**
     * 设置活动编辑器
     */
    _initContext(context) {
      this._context = context;
    }
  };

  return windowApi;
}

module.exports = { create, QuickPickItem, QuickPickOptions, InputBoxOptions, MessageBoxOptions };
