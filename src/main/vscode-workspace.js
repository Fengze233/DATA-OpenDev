/**
 * VSCode Workspace API - OpenDev IDE
 * 实现 vscode.workspace 子集
 */

const fs = require('fs');
const path = require('path');

/**
 * Uri 类 - 文件URI
 */
class Uri {
  constructor(scheme, authority, path, query, fragment) {
    this.scheme = scheme || 'file';
    this.authority = authority || '';
    this.path = path || '/';
    this.query = query || '';
    this.fragment = fragment || '';
  }

  static file(filePath) {
    return new Uri('file', '', filePath);
  }

  static parse(uriString) {
    // 简单解析: file:///path 或 file:///c:/path
    const match = uriString.match(/^(\w+):\/\/(?:([^/]+))?(.*)$/);
    if (match) {
      return new Uri(match[1], '', match[3]);
    }
    return new Uri('file', '', uriString);
  }

  toString() {
    let result = `${this.scheme}://${this.path}`;
    if (this.query) result += `?${this.query}`;
    if (this.fragment) result += `#${this.fragment}`;
    return result;
  }

  toFsPath() {
    if (this.scheme === 'file') {
      // Windows 路径处理
      if (this.path.startsWith('/') && /^\/[a-zA-Z]:/.test(this.path)) {
        return this.path.slice(1);
      }
      return this.path;
    }
    return this.path;
  }
}

/**
 * WorkspaceTextDocument 文本文档
 */
class WorkspaceTextDocument {
  constructor(uri, content = '') {
    this._uri = uri;
    this._content = content;
    this._isDirty = false;
    this._languageId = '';
    this._version = 1;
  }

  get uri() { return this._uri; }
  get fileName() { return this._uri.toFsPath(); }
  get isDirty() { return this._isDirty; }
  get languageId() { return this._languageId; }
  get version() { return this._version; }

  getText() {
    return this._content;
  }

  setText(text) {
    this._content = text;
    this._version++;
    this._isDirty = true;
  }

  save() {
    // 保存到文件系统
    try {
      const filePath = this.fileName;
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, this._content, 'utf-8');
      this._isDirty = false;
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

/**
 * WorkspaceFileSystem 文件系统API
 */
class WorkspaceFileSystem {
  constructor(vscode) {
    this._vscode = vscode;
  }

  /**
   * 读取文件
   * vscode.workspace.fs.readFile(uri)
   */
  readFile(uri) {
    const filePath = uri instanceof Uri ? uri.toFsPath() : uri;
    try {
      const content = fs.readFileSync(filePath);
      return Promise.resolve(content);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * 写入文件
   * vscode.workspace.fs.writeFile(uri, content)
   */
  writeFile(uri, content) {
    const filePath = uri instanceof Uri ? uri.toFsPath() : uri;
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * 删除文件
   * vscode.workspace.fs.delete(uri)
   */
  delete(uri, options = {}) {
    const filePath = uri instanceof Uri ? uri.toFsPath() : uri;
    try {
      if (fs.existsSync(filePath)) {
        if (fs.statSync(filePath).isDirectory()) {
          fs.rmdirSync(filePath, { recursive: options.recursive });
        } else {
          fs.unlinkSync(filePath);
        }
      }
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * 创建目录
   * vscode.workspace.fs.createDirectory(uri)
   */
  createDirectory(uri) {
    const dirPath = uri instanceof Uri ? uri.toFsPath() : uri;
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * 复制文件
   * vscode.workspace.fs.copy(source, destination)
   */
  copy(source, destination, options = {}) {
    const src = source instanceof Uri ? source.toFsPath() : source;
    const dest = destination instanceof Uri ? destination.toFsPath() : destination;
    try {
      const content = fs.readFileSync(src);
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.writeFileSync(dest, content);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * 读取目录
   * vscode.workspace.fs.readDirectory(uri)
   */
  readDirectory(uri) {
    const dirPath = uri instanceof Uri ? uri.toFsPath() : uri;
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const result = entries.map(entry => [
        entry.name,
        entry.isDirectory() ? 1 : 0  // 1 = directory, 0 = file
      ]);
      return Promise.resolve(result);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * 检查文件是否存在
   * vscode.workspace.fs.exists(uri)
   */
  exists(uri) {
    const filePath = uri instanceof Uri ? uri.toFsPath() : uri;
    return Promise.resolve(fs.existsSync(filePath));
  }

  /**
   * 获取文件统计信息
   * vscode.workspace.fs.stat(uri)
   */
  stat(uri) {
    const filePath = uri instanceof Uri ? uri.toFsPath() : uri;
    try {
      const stats = fs.statSync(filePath);
      return Promise.resolve({
        type: stats.isDirectory() ? 2 : 1,  // 2 = directory, 1 = file
        size: stats.size,
        mtime: stats.mtime.getTime(),
        ctime: stats.ctime.getTime()
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

/**
 * WorkspaceConfiguration 工作区配置
 */
class WorkspaceConfiguration {
  constructor(section = '') {
    this._section = section;
    this._data = {};
  }

  get(key, defaultValue) {
    const keys = this._section ? `${this._section}.${key}` : key;
    const value = this._getNestedValue(keys);
    return value !== undefined ? value : defaultValue;
  }

  update(key, value) {
    const keys = this._section ? `${this._section}.${key}` : key;
    this._setNestedValue(keys, value);
    return Promise.resolve();
  }

  has(key) {
    const keys = this._section ? `${this._section}.${key}` : key;
    return this._getNestedValue(keys) !== undefined;
  }

  _getNestedValue(key) {
    const keys = key.split('.');
    let value = this._data;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  }

  _setNestedValue(key, value) {
    const keys = key.split('.');
    let obj = this._data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
  }

  inspect(key) {
    const value = this.get(key);
    return {
      key,
      defaultValue: value,
      globalValue: value,
      workspaceValue: value
    };
  }
}

/**
 * 创建 workspace 模块
 */
function create(vscode) {
  const workspaceApi = {
    _context: null,
    
    /**
     * 工作区文件夹
     */
    get workspaceFolders() {
      if (this._context && this._context.workspaceFolders) {
        return this._context.workspaceFolders;
      }
      return null;
    },
    
    /**
     * 工作区根路径
     */
    get rootPath() {
      const folders = this.workspaceFolders;
      return folders && folders.length > 0 ? folders[0].uri.toFsPath() : null;
    },

    /**
     * 文件系统
     */
    get fs() {
      if (!this._fs) {
        this._fs = new WorkspaceFileSystem(vscode);
      }
      return this._fs;
    },

    /**
     * 获取文本文档
     * @deprecated 使用 workspace.textDocuments
     */
    get textDocuments() {
      return this._context ? this._context.textDocuments || [] : [];
    },

    /**
     * 获取工作区配置
     * vscode.workspace.getConfiguration(section)
     */
    getConfiguration(section = '') {
      return new WorkspaceConfiguration(section);
    },

    /**
     * 创建文件
     * vscode.workspace.createFile(uri, options)
     */
    createFile(uri, options = {}) {
      const filePath = uri instanceof Uri ? uri.toFsPath() : uri;
      return new Promise((resolve, reject) => {
        try {
          if (!fs.existsSync(filePath)) {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            const content = options.content || '';
            fs.writeFileSync(filePath, content, 'utf-8');
          }
          resolve(Uri.file(filePath));
        } catch (e) {
          reject(e);
        }
      });
    },

    /**
     * 打开文本文档
     * vscode.workspace.openTextDocument(uri)
     */
    openTextDocument(uri) {
      const filePath = uri instanceof Uri ? uri.toFsPath() : uri;
      return new Promise((resolve, reject) => {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const doc = new WorkspaceTextDocument(Uri.file(filePath), content);
          
          // 推断语言ID
          const ext = path.extname(filePath).toLowerCase();
          const langMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.go': 'go',
            '.rs': 'rust',
            '.html': 'html',
            '.css': 'css',
            '.json': 'json',
            '.md': 'markdown'
          };
          doc._languageId = langMap[ext] || 'plaintext';
          
          resolve(doc);
        } catch (e) {
          reject(e);
        }
      });
    },

    /**
     * 打开文件URI
     * vscode.workspace.openTextDocument(uriString)
     */
    async openTextDocument(uriString) {
      const uri = Uri.parse(uriString);
      return this.openTextDocument(uri);
    },

    /**
     * 保存所有文档
     * vscode.workspace.saveAll()
     */
    saveAll() {
      const docs = this.textDocuments;
      return Promise.all(docs.map(d => d.save()));
    },

    /**
     * 注册文件系统提供者
     * vscode.workspace.registerFileSystemProvider(scheme, provider)
     */
    registerFileSystemProvider(scheme, provider) {
      // TODO: 实现自定义文件系统提供者
      return { dispose: () => {} };
    },

    /**
     * 注册文本文档内容提供者
     * vscode.workspace.registerTextDocumentContentProvider(scheme, provider)
     */
    registerTextDocumentContentProvider(scheme, provider) {
      // TODO: 实现
      return { dispose: () => {} };
    },

    /**
     * 获取工作区文件夹
     * vscode.workspace.getWorkspaceFolder(uri)
     */
    getWorkspaceFolder(uri) {
      const folders = this.workspaceFolders;
      if (!folders) return null;
      
      const uriPath = uri instanceof Uri ? uri.toFsPath() : uri;
      
      for (const folder of folders) {
        const folderPath = folder.uri.toFsPath();
        if (uriPath.startsWith(folderPath)) {
          return folder;
        }
      }
      return null;
    },

    /**
     * 更新工作区配置
     * vscode.workspace.applyConfigurationEdit(edit)
     */
    applyConfigurationEdit(edit) {
      // TODO: 实现
      return Promise.resolve();
    },

    /**
     * 初始化上下文
     */
    _initContext(context) {
      this._context = context;
    }
  };

  return workspaceApi;
}

module.exports = { create, Uri, WorkspaceTextDocument, WorkspaceConfiguration };
