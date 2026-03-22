/**
 * VSCode Languages API - OpenDev IDE
 * 实现 vscode.languages 子集
 */

/**
 * 创建 languages 模块
 */
function create(vscode) {
  const languagesApi = {
    _context: null,
    _completionProviders: new Map(),
    _hoverProviders: new Map(),
    _definitionProviders: new Map(),
    _signatureHelpProviders: new Map(),
    _documentSymbolProviders: new Map(),
    _codeActionProviders: new Map(),
    _codeLensProviders: new Map(),
    _documentFormattingProviders: new Map(),
    _documentRangeFormattingProviders: new Map(),
    _onTypeFormattingProviders: new Map(),
    _renameProviders: new Map(),
    
    /**
     * 注册补全项提供者
     * vscode.languages.registerCompletionItemProvider(selector, provider, ...triggerChars)
     */
    registerCompletionItemProvider(selector, provider, ...triggerChars) {
      const providerId = `completion-${Date.now()}`;
      
      const providerInfo = {
        id: providerId,
        selector,
        provider,
        triggerChars: triggerChars || [],
        triggerCharacters: triggerChars || []
      };
      
      this._completionProviders.set(providerId, providerInfo);
      
      // 通知系统
      if (this._context && this._context.events) {
        this._context.events.emit('languages:registerCompletionProvider', {
          providerId,
          selector,
          triggerChars
        });
      }
      
      return {
        dispose: () => {
          this._completionProviders.delete(providerId);
          if (this._context && this._context.events) {
            this._context.events.emit('languages:unregisterCompletionProvider', { providerId });
          }
        }
      };
    },
    
    /**
     * 注册悬停提示提供者
     * vscode.languages.registerHoverProvider(selector, provider)
     */
    registerHoverProvider(selector, provider) {
      const providerId = `hover-${Date.now()}`;
      
      const providerInfo = {
        id: providerId,
        selector,
        provider
      };
      
      this._hoverProviders.set(providerId, providerInfo);
      
      if (this._context && this._context.events) {
        this._context.events.emit('languages:registerHoverProvider', { providerId, selector });
      }
      
      return {
        dispose: () => {
          this._hoverProviders.delete(providerId);
        }
      };
    },
    
    /**
     * 注册定义提供者
     * vscode.languages.registerDefinitionProvider(selector, provider)
     */
    registerDefinitionProvider(selector, provider) {
      const providerId = `definition-${Date.now()}`;
      
      this._definitionProviders.set(providerId, {
        id: providerId,
        selector,
        provider
      });
      
      return {
        dispose: () => {
          this._definitionProviders.delete(providerId);
        }
      };
    },
    
    /**
     * 注册签名帮助提供者
     * vscode.languages.registerSignatureHelpProvider(selector, provider, ...triggerChars)
     */
    registerSignatureHelpProvider(selector, provider, ...triggerChars) {
      const providerId = `signature-${Date.now()}`;
      
      this._signatureHelpProviders.set(providerId, {
        id: providerId,
        selector,
        provider,
        triggerChars: triggerChars || []
      });
      
      return {
        dispose: () => {
          this._signatureHelpProviders.delete(providerId);
        }
      };
    },
    
    /**
     * 注册文档符号提供者
     * vscode.languages.registerDocumentSymbolProvider(selector, provider)
     */
    registerDocumentSymbolProvider(selector, provider) {
      const providerId = `documentSymbol-${Date.now()}`;
      
      this._documentSymbolProviders.set(providerId, {
        id: providerId,
        selector,
        provider
      });
      
      return {
        dispose: () => {
          this._documentSymbolProviders.delete(providerId);
        }
      };
    },
    
    /**
     * 注册代码动作提供者
     * vscode.languages.registerCodeActionsProvider(selector, provider)
     */
    registerCodeActionsProvider(selector, provider, metadata) {
      const providerId = `codeAction-${Date.now()}`;
      
      this._codeActionProviders.set(providerId, {
        id: providerId,
        selector,
        provider,
        metadata
      });
      
      return {
        dispose: () => {
          this._codeActionProviders.delete(providerId);
        }
      };
    },
    
    /**
     * 注册代码镜头提供者
     * vscode.languages.registerCodeLensProvider(selector, provider)
     */
    registerCodeLensProvider(selector, provider) {
      const providerId = `codeLens-${Date.now()}`;
      
      this._codeLensProviders.set(providerId, {
        id: providerId,
        selector,
        provider
      });
      
      return {
        dispose: () => {
          this._codeLensProviders.delete(providerId);
        }
      };
    },
    
    /**
     * 注册文档格式化提供者
     * vscode.languages.registerDocumentFormattingEditProvider(selector, provider)
     */
    registerDocumentFormattingEditProvider(selector, provider) {
      const providerId = `documentFormatting-${Date.now()}`;
      
      this._documentFormattingProviders.set(providerId, {
        id: providerId,
        selector,
        provider
      });
      
      return {
        dispose: () => {
          this._documentFormattingProviders.delete(providerId);
        }
      };
    },
    
    /**
     * 注册范围格式化提供者
     * vscode.languages.registerDocumentRangeFormattingEditProvider(selector, provider)
     */
    registerDocumentRangeFormattingEditProvider(selector, provider) {
      const providerId = `documentRangeFormatting-${Date.now()}`;
      
      this._documentRangeFormattingProviders.set(providerId, {
        id: providerId,
        selector,
        provider
      });
      
      return {
        dispose: () => {
          this._documentRangeFormattingProviders.delete(providerId);
        }
      };
    },
    
    /**
     * 注册重命名提供者
     * vscode.languages.registerRenameProvider(selector, provider)
     */
    registerRenameProvider(selector, provider) {
      const providerId = `rename-${Date.now()}`;
      
      this._renameProviders.set(providerId, {
        id: providerId,
        selector,
        provider
      });
      
      return {
        dispose: () => {
          this._renameProviders.delete(providerId);
        }
      };
    },
    
    /**
     * 创建语言匹配器
     * vscode.languages.createLanguageMatcher(languageId, fileNamePatterns)
     */
    createLanguageMatcher(languageId, fileNamePatterns) {
      return {
        language: languageId,
        pattern: fileNamePatterns
      };
    },
    
    /**
     * 获取文档语言ID
     * vscode.languages.getDocumentLanguageId(document)
     */
    getDocumentLanguageId(document) {
      return document.languageId || 'plaintext';
    },
    
    /**
     * 设置文档语言ID
     * vscode.languages.setDocumentLanguage(document, languageId)
     */
    setDocumentLanguage(document, languageId) {
      document._languageId = languageId;
      
      if (this._context && this._context.events) {
        this._context.events.emit('languages:documentLanguageChanged', {
          document,
          languageId
        });
      }
      
      return Promise.resolve();
    },
    
    /**
     * 匹配文档与选择器
     * vscode.languages.match(selector, document)
     */
    match(selector, document) {
      if (!selector || !document) return 0;
      
      // 简单实现：匹配语言ID
      if (typeof selector === 'string') {
        return selector === document.languageId ? 1 : 0;
      }
      
      // 数组选择器
      if (Array.isArray(selector)) {
        for (const s of selector) {
          const match = this.match(s, document);
          if (match > 0) return match;
        }
        return 0;
      }
      
      // 对象选择器
      if (typeof selector === 'object') {
        if (selector.language) {
          return selector.language === document.languageId ? 1 : 0;
        }
        if (selector.pattern) {
          // TODO: 实现glob匹配
          return 0;
        }
      }
      
      return 0;
    },
    
    /**
     * 获取文件语言ID
     * vscode.languages.getLanguages()
     */
    getLanguages() {
      return Promise.resolve([
        'plaintext', 'javascript', 'typescript', 'python', 'java',
        'cpp', 'c', 'csharp', 'go', 'rust', 'ruby', 'php', 'swift',
        'kotlin', 'scala', 'html', 'css', 'scss', 'json', 'xml',
        'yaml', 'markdown', 'sql', 'shell', 'powershell'
      ]);
    },
    
    /**
     * 加载语言扩展
     * vscode.languages.loadExtension(extension)
     */
    loadExtension(extension) {
      // TODO: 实现语言扩展加载
      return Promise.resolve();
    },
    
    /**
     * 获取补全项
     * 内部方法：由编辑器调用
     */
    _getCompletionItems(document, position, context) {
      const languageId = document.languageId;
      const providers = Array.from(this._completionProviders.values())
        .filter(p => this.match(p.selector, document));
      
      const results = [];
      
      for (const providerInfo of providers) {
        try {
          const items = providerInfo.provider.provideCompletionItems(document, position, context);
          
          if (items) {
            // 处理CompletionList或CompletionItem[]
            if (items.items) {
              results.push(...items.items);
            } else if (Array.isArray(items)) {
              results.push(...items);
            }
          }
        } catch (e) {
          console.error(`[Languages] Completion provider error:`, e);
        }
      }
      
      return results;
    },
    
    /**
     * 获取悬停提示
     */
    _getHover(document, position) {
      const providers = Array.from(this._hoverProviders.values())
        .filter(p => this.match(p.selector, document));
      
      for (const providerInfo of providers) {
        try {
          const hover = providerInfo.provider.provideHover(document, position);
          if (hover) return hover;
        } catch (e) {
          console.error(`[Languages] Hover provider error:`, e);
        }
      }
      
      return null;
    },
    
    /**
     * 获取定义
     */
    _getDefinition(document, position) {
      const providers = Array.from(this._definitionProviders.values())
        .filter(p => this.match(p.selector, document));
      
      for (const providerInfo of providers) {
        try {
          const definition = providerInfo.provider.provideDefinition(document, position);
          if (definition) return definition;
        } catch (e) {
          console.error(`[Languages] Definition provider error:`, e);
        }
      }
      
      return null;
    },
    
    /**
     * 获取签名帮助
     */
    _getSignatureHelp(document, position, token) {
      const providers = Array.from(this._signatureHelpProviders.values())
        .filter(p => this.match(p.selector, document));
      
      for (const providerInfo of providers) {
        try {
          const sigHelp = providerInfo.provider.provideSignatureHelp(document, position, token);
          if (sigHelp) return sigHelp;
        } catch (e) {
          console.error(`[Languages] Signature help provider error:`, e);
        }
      }
      
      return null;
    },
    
    /**
     * 初始化上下文
     */
    _initContext(context) {
      this._context = context;
    }
  };

  return languagesApi;
}

module.exports = { create };
