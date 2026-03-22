/**
 * VSCode Commands API - OpenDev IDE
 * 实现 vscode.commands 子集
 */

/**
 * 创建 commands 模块
 */
function create(vscode) {
  const commandsApi = {
    _context: null,
    _registeredCommands: new Map(),
    
    /**
     * 注册命令
     * vscode.commands.registerCommand(commandId, handler)
     */
    registerCommand(commandId, handler) {
      // 存储命令
      this._registeredCommands.set(commandId, {
        id: commandId,
        handler: handler,
        thisArg: null
      });
      
      // 通知系统
      if (this._context && this._context.events) {
        this._context.events.emit('commands:registerCommand', {
          commandId,
          handler: handler.name || 'anonymous'
        });
      }
      
      // 返回 disposable
      return {
        dispose: () => {
          this._registeredCommands.delete(commandId);
          if (this._context && this._context.events) {
            this._context.events.emit('commands:unregisterCommand', { commandId });
          }
        }
      };
    },
    
    /**
     * 注册文本编辑器命令
     * vscode.commands.registerTextEditorCommand(commandId, handler)
     */
    registerTextEditorCommand(commandId, handler) {
      // 类似于 registerCommand，但会传递 textEditor 和 edit
      this._registeredCommands.set(commandId, {
        id: commandId,
        handler: handler,
        thisArg: null,
        isTextEditorCommand: true
      });
      
      if (this._context && this._context.events) {
        this._context.events.emit('commands:registerTextEditorCommand', {
          commandId,
          handler: handler.name || 'anonymous'
        });
      }
      
      return {
        dispose: () => {
          this._registeredCommands.delete(commandId);
          if (this._context && this._context.events) {
            this._context.events.emit('commands:unregisterCommand', { commandId });
          }
        }
      };
    },
    
    /**
     * 执行命令
     * vscode.commands.executeCommand(commandId, ...args)
     */
    executeCommand(commandId, ...args) {
      // 检查是否是已注册的命令
      const cmd = this._registeredCommands.get(commandId);
      
      if (cmd) {
        try {
          if (cmd.isTextEditorCommand) {
            // 文本编辑器命令需要传递 textEditor 和 edit
            const { activeTextEditor } = this._context?.window || {};
            if (activeTextEditor) {
              const editBuilder = {
                replace: (range, text) => {
                  activeTextEditor.document.setText(text);
                },
                insert: (position, text) => {
                  const doc = activeTextEditor.document;
                  const content = doc.getText();
                  doc.setText(content.slice(0, position) + text + content.slice(position));
                },
                delete: (range) => {
                  activeTextEditor.document.setText('');
                }
              };
              return Promise.resolve(cmd.handler(activeTextEditor, editBuilder, ...args));
            }
          }
          return Promise.resolve(cmd.handler(...args));
        } catch (e) {
          return Promise.reject(e);
        }
      }
      
      // 检查内置命令
      const builtInCommands = {
        'editor.action.selectAll': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'editor.action.copyLinesDownAction': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'editor.action.copyLinesUpAction': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'editor.action.moveLinesUpAction': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'editor.action.moveLinesDownAction': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'editor.action.formatDocument': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'editor.action.formatSelection': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'editor.action.commentLine': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'editor.action.addCommentLine': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'editor.action.removeCommentLine': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'editor.action.toggleTabFocusMode': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.files.newUntitledFile': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.files.save': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.files.saveAll': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.closeActiveEditor': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.closeAllEditors': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.nextEditor': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.previousEditor': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.toggleSidebarVisibility': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.toggleActivityBarVisibility': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.toggleStatusbarVisibility': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.openSettings': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.openGlobalSettings': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.openWorkspaceSettings': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.quickOpen': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.showCommands': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.toggleZenMode': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.terminal.toggleTerminal': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        },
        'workbench.action.terminal.new': () => {
          if (this._context && this._context.events) {
            this._context.events.emit('commands:execute', { commandId, args });
          }
          return Promise.resolve(undefined);
        }
      };
      
      if (builtInCommands[commandId]) {
        return builtInCommands[commandId](...args);
      }
      
      // 命令未找到
      return Promise.reject(new Error(`命令未注册: ${commandId}`));
    },
    
    /**
     * 获取已注册命令列表
     * vscode.commands.getCommands(filterInternal)
     */
    getCommands(filterInternal = false) {
      const commands = Array.from(this._registeredCommands.keys());
      
      if (!filterInternal) {
        return Promise.resolve(commands);
      }
      
      // 过滤内部命令
      const filtered = commands.filter(cmd => !cmd.startsWith('_'));
      return Promise.resolve(filtered);
    },
    
    /**
     * 注册命令处理器
     * vscode.commands.registerHandler(commandId, handler)
     */
    registerHandler(commandId, handler) {
      return this.registerCommand(commandId, handler);
    },
    
    /**
     * 初始化上下文
     */
    _initContext(context) {
      this._context = context;
    }
  };

  return commandsApi;
}

module.exports = { create };
