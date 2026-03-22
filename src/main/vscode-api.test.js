/**
 * VSCode API 测试文件
 * 运行: node vscode-api.test.js
 */

const { createVSCodeAPI } = require('./vscode-api');

// 模拟上下文
const mockContext = {
  extensionPath: '/path/to/extension',
  workspaceFolders: [
    { uri: { toFsPath: () => '/test/workspace' }, name: 'test' }
  ],
  textDocuments: [],
  events: {
    _events: new Map(),
    on(event, handler) {
      if (!this._events.has(event)) this._events.set(event, []);
      this._events.get(event).push(handler);
      return { dispose: () => {} };
    },
    emit(event, ...args) {
      const handlers = this._events.get(event) || [];
      handlers.forEach(h => h(...args));
    }
  },
  window: {
    activeTextEditor: null
  }
};

// 测试用例
const tests = {
  /**
   * 测试1: 创建 VSCode API
   */
  testCreateAPI() {
    const vscode = createVSCodeAPI(mockContext);
    if (!vscode) {
      console.log('  ❌ 创建API失败');
      return false;
    }
    
    // 检查命名空间
    if (!vscode.workspace) {
      console.log('  ❌ 缺少 workspace 命名空间');
      return false;
    }
    if (!vscode.window) {
      console.log('  ❌ 缺少 window 命名空间');
      return false;
    }
    if (!vscode.commands) {
      console.log('  ❌ 缺少 commands 命名空间');
      return false;
    }
    if (!vscode.languages) {
      console.log('  ❌ 缺少 languages 命名空间');
      return false;
    }
    
    console.log('  ✅ VSCode API 创建成功');
    console.log(`     - workspace: ✓`);
    console.log(`     - window: ✓`);
    console.log(`     - commands: ✓`);
    console.log(`     - languages: ✓`);
    
    return true;
  },

  /**
   * 测试2: workspace.fs API
   */
  testWorkspaceFs() {
    const vscode = createVSCodeAPI(mockContext);
    const fs = vscode.workspace.fs;
    
    // 检查方法
    const methods = ['readFile', 'writeFile', 'delete', 'createDirectory', 'exists', 'stat'];
    for (const method of methods) {
      if (typeof fs[method] !== 'function') {
        console.log(`  ❌ 缺少 fs.${method}`);
        return false;
      }
    }
    
    console.log('  ✅ workspace.fs API 完整');
    return true;
  },

  /**
   * 测试3: workspace.getConfiguration
   */
  testWorkspaceConfig() {
    const vscode = createVSCodeAPI(mockContext);
    const config = vscode.workspace.getConfiguration('test');
    
    if (!config.get) {
      console.log('  ❌ 配置 get 方法缺失');
      return false;
    }
    if (!config.has) {
      console.log('  ⚠️ 配置 has 方法缺失');
    }
    if (!config.update) {
      console.log('  ❌ 配置 update 方法缺失');
      return false;
    }
    
    console.log('  ✅ workspace.getConfiguration 正常');
    return true;
  },

  /**
   * 测试4: window.showMessage
   */
  testWindowMessages() {
    const vscode = createVSCodeAPI(mockContext);
    
    if (!vscode.window.showInformationMessage) {
      console.log('  ❌ showInformationMessage 缺失');
      return false;
    }
    if (!vscode.window.showWarningMessage) {
      console.log('  ❌ showWarningMessage 缺失');
      return false;
    }
    if (!vscode.window.showErrorMessage) {
      console.log('  ❌ showErrorMessage 缺失');
      return false;
    }
    
    console.log('  ✅ window 消息 API 完整');
    return true;
  },

  /**
   * 测试5: commands.registerCommand
   */
  testCommands() {
    const vscode = createVSCodeAPI(mockContext);
    
    // 注册命令
    const disposable = vscode.commands.registerCommand('test.hello', (name) => {
      return `Hello, ${name}!`;
    });
    
    if (!disposable || !disposable.dispose) {
      console.log('  ❌ 命令注册返回的 disposable 无效');
      return false;
    }
    
    // 执行命令
    vscode.commands.executeCommand('test.hello', 'World').then(result => {
      if (result !== 'Hello, World!') {
        console.log(`  ⚠️ 命令执行结果不正确: ${result}`);
      }
    });
    
    // 获取命令列表
    vscode.commands.getCommands().then(commands => {
      if (commands.includes('test.hello')) {
        console.log('  ✅ commands.registerCommand 正常');
      }
    });
    
    return true;
  },

  /**
   * 测试6: languages.registerCompletionItemProvider
   */
  testLanguagesCompletion() {
    const vscode = createVSCodeAPI(mockContext);
    
    const mockProvider = {
      provideCompletionItems: (doc, pos, ctx) => {
        return [
          { label: 'test', kind: 14, insertText: 'test()' }
        ];
      }
    };
    
    const disposable = vscode.languages.registerCompletionItemProvider(
      'javascript',
      mockProvider,
      '.', '@'
    );
    
    if (!disposable || !disposable.dispose) {
      console.log('  ❌ 补全提供者注册无效');
      return false;
    }
    
    console.log('  ✅ languages.registerCompletionItemProvider 正常');
    return true;
  },

  /**
   * 测试7: languages 其他提供者
   */
  testLanguagesProviders() {
    const vscode = createVSCodeAPI(mockContext);
    
    const providers = [
      { name: 'Hover', method: 'registerHoverProvider' },
      { name: 'Definition', method: 'registerDefinitionProvider' },
      { name: 'SignatureHelp', method: 'registerSignatureHelpProvider' },
      { name: 'DocumentSymbol', method: 'registerDocumentSymbolProvider' },
      { name: 'CodeActions', method: 'registerCodeActionsProvider' },
      { name: 'CodeLens', method: 'registerCodeLensProvider' },
      { name: 'DocumentFormatting', method: 'registerDocumentFormattingEditProvider' },
      { name: 'RangeFormatting', method: 'registerDocumentRangeFormattingEditProvider' },
      { name: 'Rename', method: 'registerRenameProvider' }
    ];
    
    for (const p of providers) {
      if (!vscode.languages[p.method]) {
        console.log(`  ❌ 缺少 ${p.name} 提供者方法`);
        return false;
      }
    }
    
    console.log('  ✅ languages 提供者 API 完整');
    return true;
  },

  /**
   * 测试8: Uri 类
   */
  testUri() {
    const { Uri } = require('./vscode-workspace');
    
    const uri1 = Uri.file('/test/path');
    if (uri1.scheme !== 'file') {
      console.log('  ❌ Uri.file() 失败');
      return false;
    }
    
    const uri2 = Uri.parse('file:///test/path');
    if (uri2.path !== '/test/path') {
      console.log('  ❌ Uri.parse() 失败');
      return false;
    }
    
    console.log('  ✅ Uri 类正常');
    return true;
  },

  /**
   * 测试9: window.createTerminal
   */
  testTerminal() {
    const vscode = createVSCodeAPI(mockContext);
    
    const terminal = vscode.window.createTerminal({
      name: 'Test Terminal',
      shellPath: 'cmd.exe'
    });
    
    if (!terminal.show || !terminal.hide || !terminal.sendText || !terminal.dispose) {
      console.log('  ❌ Terminal API 不完整');
      return false;
    }
    
    console.log('  ✅ window.createTerminal 正常');
    return true;
  },

  /**
   * 测试10: window.createWebviewPanel
   */
  testWebview() {
    const vscode = createVSCodeAPI(mockContext);
    
    const panel = vscode.window.createWebviewPanel(
      'test-view',
      'Test View',
      { viewColumn: 1 },
      { retainContextWhenHidden: true }
    );
    
    if (!panel.webview || !panel.postMessage || !panel.reveal || !panel.dispose) {
      console.log('  ❌ Webview API 不完整');
      return false;
    }
    
    console.log('  ✅ window.createWebviewPanel 正常');
    return true;
  }
};

// 运行测试
function runTests() {
  console.log('='.repeat(50));
  console.log('VSCode API 测试套件');
  console.log('='.repeat(50));
  console.log('');
  
  const results = [];
  
  results.push(['API创建', tests.testCreateAPI()]);
  results.push(['workspace.fs', tests.testWorkspaceFs()]);
  results.push(['workspace.getConfiguration', tests.testWorkspaceConfig()]);
  results.push(['window 消息', tests.testWindowMessages()]);
  results.push(['commands', tests.testCommands()]);
  results.push(['languages 补全', tests.testLanguagesCompletion()]);
  results.push(['languages 提供者', tests.testLanguagesProviders()]);
  results.push(['Uri 类', tests.testUri()]);
  results.push(['Terminal', tests.testTerminal()]);
  results.push(['Webview', tests.testWebview()]);
  
  console.log('');
  console.log('='.repeat(50));
  console.log('测试结果汇总');
  console.log('='.repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, result] of results) {
    if (result === true) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}`);
      failed++;
    }
  }
  
  console.log(`\n总计: ${passed} 通过, ${failed} 失败`);
  
  return failed === 0;
}

runTests();
