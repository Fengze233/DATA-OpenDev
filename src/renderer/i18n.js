/**
 * i18n.js - 多语言支持模块
 * 支持: 英语(en), 简体中文(zh-CN), 繁体中文(zh-TW)
 * 编码: UTF-8
 */

// 语言资源
const translations = {
  // 英语
  'en': {
    // 菜单
    'menu.file': 'File',
    'menu.edit': 'Edit',
    'menu.view': 'View',
    'menu.window': 'Window',
    'menu.help': 'Help',
    'menu.openFile': 'Open File',
    'menu.openFolder': 'Open Folder',
    'menu.save': 'Save',
    'menu.saveAs': 'Save As',
    'menu.newFile': 'New File',
    'menu.newFolder': 'New Folder',
    'menu.exit': 'Exit',
    'menu.undo': 'Undo',
    'menu.redo': 'Redo',
    'menu.cut': 'Cut',
    'menu.copy': 'Copy',
    'menu.paste': 'Paste',
    'menu.selectAll': 'Select All',
    'menu.reload': 'Reload',
    'menu.toggleDevTools': 'Toggle Developer Tools',
    'menu.resetZoom': 'Reset Zoom',
    'menu.zoomIn': 'Zoom In',
    'menu.zoomOut': 'Zoom Out',
    'menu.fullscreen': 'Toggle Fullscreen',
    'menu.minimize': 'Minimize',
    'menu.close': 'Close',

    // 工具栏
    'toolbar.openFile': 'Open File',
    'toolbar.save': 'Save',
    'toolbar.newFile': 'New File',
    'toolbar.newFolder': 'New Folder',
    'toolbar.delete': 'Delete',
    'toolbar.rename': 'Rename',
    'toolbar.refresh': 'Refresh',

    // 侧边栏
    'sidebar.fileExplorer': 'File Explorer',
    'sidebar.openFolderPrompt': 'Click "Open Folder" to select a project folder',

    // 欢迎页
    'welcome.title': 'OpenDev IDE',
    'welcome.subtitle': 'AI-Powered Full-Stack Development IDE',
    'welcome.openProject': 'Open Project',

    // 状态栏
    'status.noFile': 'No File Open',
    'status.encoding': 'UTF-8',
    'status.language': 'Plain Text',

    // 对话框
    'dialog.confirm': 'Confirm',
    'dialog.cancel': 'Cancel',
    'dialog.ok': 'OK',
    'dialog.deleteTitle': 'Delete',
    'dialog.deleteMessage': 'Are you sure you want to delete this item?',
    'dialog.deleteDetail': 'This action cannot be undone.',
    'dialog.newFileTitle': 'New File',
    'dialog.newFilePrompt': 'Enter file name:',
    'dialog.newFolderTitle': 'New Folder',
    'dialog.newFolderPrompt': 'Enter folder name:',
    'dialog.renameTitle': 'Rename',
    'dialog.renamePrompt': 'Enter new name:',
    'dialog.error': 'Error',
    'dialog.success': 'Success',

    // 消息
    'msg.fileSaved': 'File saved successfully',
    'msg.fileCreated': 'File created successfully',
    'msg.folderCreated': 'Folder created successfully',
    'msg.deleted': 'Deleted successfully',
    'msg.renamed': 'Renamed successfully',
    'msg.fileExists': 'File already exists',
    'msg.folderExists': 'Folder already exists',
    'msg.targetExists': 'Target name already exists',
    'msg.unsavedChanges': 'You have unsaved changes. Save before closing?',

    // 语言
    'language.name': 'Language',
    'language.en': 'English',
    'language.zhCN': 'Simplified Chinese',
    'language.zhTW': 'Traditional Chinese'
  },

  // 简体中文
  'zh-CN': {
    // 菜单
    'menu.file': '文件',
    'menu.edit': '编辑',
    'menu.view': '视图',
    'menu.window': '窗口',
    'menu.help': '帮助',
    'menu.openFile': '打开文件',
    'menu.openFolder': '打开文件夹',
    'menu.save': '保存',
    'menu.saveAs': '另存为',
    'menu.newFile': '新建文件',
    'menu.newFolder': '新建文件夹',
    'menu.exit': '退出',
    'menu.undo': '撤销',
    'menu.redo': '重做',
    'menu.cut': '剪切',
    'menu.copy': '复制',
    'menu.paste': '粘贴',
    'menu.selectAll': '全选',
    'menu.reload': '刷新',
    'menu.toggleDevTools': '切换开发者工具',
    'menu.resetZoom': '重置缩放',
    'menu.zoomIn': '放大',
    'menu.zoomOut': '缩小',
    'menu.fullscreen': '切换全屏',
    'menu.minimize': '最小化',
    'menu.close': '关闭',

    // 工具栏
    'toolbar.openFile': '打开文件',
    'toolbar.save': '保存',
    'toolbar.newFile': '新建文件',
    'toolbar.newFolder': '新建文件夹',
    'toolbar.delete': '删除',
    'toolbar.rename': '重命名',
    'toolbar.refresh': '刷新',

    // 侧边栏
    'sidebar.fileExplorer': '文件资源管理器',
    'sidebar.openFolderPrompt': '点击"打开文件夹"选择项目目录',

    // 欢迎页
    'welcome.title': 'OpenDev IDE',
    'welcome.subtitle': 'AI全栈自动开发IDE',
    'welcome.openProject': '打开项目',

    // 状态栏
    'status.noFile': '未打开文件',
    'status.encoding': 'UTF-8',
    'status.language': '纯文本',

    // 对话框
    'dialog.confirm': '确认',
    'dialog.cancel': '取消',
    'dialog.ok': '确定',
    'dialog.deleteTitle': '删除',
    'dialog.deleteMessage': '确定要删除此项吗？',
    'dialog.deleteDetail': '此操作无法撤销。',
    'dialog.newFileTitle': '新建文件',
    'dialog.newFilePrompt': '请输入文件名：',
    'dialog.newFolderTitle': '新建文件夹',
    'dialog.newFolderPrompt': '请输入文件夹名：',
    'dialog.renameTitle': '重命名',
    'dialog.renamePrompt': '请输入新名称：',
    'dialog.error': '错误',
    'dialog.success': '成功',

    // 消息
    'msg.fileSaved': '文件保存成功',
    'msg.fileCreated': '文件创建成功',
    'msg.folderCreated': '文件夹创建成功',
    'msg.deleted': '删除成功',
    'msg.renamed': '重命名成功',
    'msg.fileExists': '文件已存在',
    'msg.folderExists': '文件夹已存在',
    'msg.targetExists': '目标名称已存在',
    'msg.unsavedChanges': '您有未保存的更改。关闭前要保存吗？',

    // 语言
    'language.name': '语言',
    'language.en': '英语',
    'language.zhCN': '简体中文',
    'language.zhTW': '繁体中文'
  },

  // 繁体中文
  'zh-TW': {
    // 菜單
    'menu.file': '檔案',
    'menu.edit': '編輯',
    'menu.view': '檢視',
    'menu.window': '視窗',
    'menu.help': '說明',
    'menu.openFile': '開啟檔案',
    'menu.openFolder': '開啟資料夾',
    'menu.save': '儲存',
    'menu.saveAs': '另存新檔',
    'menu.newFile': '新建檔案',
    'menu.newFolder': '新建資料夾',
    'menu.exit': '結束',
    'menu.undo': '復原',
    'menu.redo': '重做',
    'menu.cut': '剪下',
    'menu.copy': '複製',
    'menu.paste': '貼上',
    'menu.selectAll': '全選',
    'menu.reload': '重新整理',
    'menu.toggleDevTools': '切換開發者工具',
    'menu.resetZoom': '重設縮放',
    'menu.zoomIn': '放大',
    'menu.zoomOut': '縮小',
    'menu.fullscreen': '切換全螢幕',
    'menu.minimize': '最小化',
    'menu.close': '關閉',

    // 工具列
    'toolbar.openFile': '開啟檔案',
    'toolbar.save': '儲存',
    'toolbar.newFile': '新建檔案',
    'toolbar.newFolder': '新建資料夾',
    'toolbar.delete': '刪除',
    'toolbar.rename': '重新命名',
    'toolbar.refresh': '重新整理',

    // 側邊欄
    'sidebar.fileExplorer': '檔案總管',
    'sidebar.openFolderPrompt': '點擊「開啟資料夾」選擇專案目錄',

    // 歡迎頁
    'welcome.title': 'OpenDev IDE',
    'welcome.subtitle': 'AI全棧自動開發IDE',
    'welcome.openProject': '開啟專案',

    // 狀態列
    'status.noFile': '未開啟檔案',
    'status.encoding': 'UTF-8',
    'status.language': '純文字',

    // 對話方塊
    'dialog.confirm': '確認',
    'dialog.cancel': '取消',
    'dialog.ok': '確定',
    'dialog.deleteTitle': '刪除',
    'dialog.deleteMessage': '確定要刪除此項目嗎？',
    'dialog.deleteDetail': '此操作無法復原。',
    'dialog.newFileTitle': '新建檔案',
    'dialog.newFilePrompt': '請輸入檔案名稱：',
    'dialog.newFolderTitle': '新建資料夾',
    'dialog.newFolderPrompt': '請輸入資料夾名稱：',
    'dialog.renameTitle': '重新命名',
    'dialog.renamePrompt': '請輸入新名稱：',
    'dialog.error': '錯誤',
    'dialog.success': '成功',

    // 訊息
    'msg.fileSaved': '檔案儲存成功',
    'msg.fileCreated': '檔案建立成功',
    'msg.folderCreated': '資料夾建立成功',
    'msg.deleted': '刪除成功',
    'msg.renamed': '重新命名成功',
    'msg.fileExists': '檔案已存在',
    'msg.folderExists': '資料夾已存在',
    'msg.targetExists': '目標名稱已存在',
    'msg.unsavedChanges': '您有未儲存的變更。關閉前要儲存嗎？',

    // 語言
    'language.name': '語言',
    'language.en': '英語',
    'language.zhCN': '簡體中文',
    'language.zhTW': '繁體中文'
  }
};

// 国际化类
class I18n {
  constructor() {
    // 默认语言
    this.currentLang = 'zh-CN';
    
    // 获取浏览器语言
    this.detectLanguage();
  }

  // 检测浏览器语言
  detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('zh')) {
      if (browserLang === 'zh-TW' || browserLang === 'zh-HK') {
        this.currentLang = 'zh-TW';
      } else {
        this.currentLang = 'zh-CN';
      }
    } else {
      this.currentLang = 'en';
    }
  }

  // 设置语言
  setLanguage(lang) {
    if (translations[lang]) {
      this.currentLang = lang;
      // 保存到 localStorage
      localStorage.setItem('opendev-lang', lang);
      // 触发语言变更事件
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    }
  }

  // 获取当前语言
  getLanguage() {
    return this.currentLang;
  }

  // 翻译
  t(key) {
    const langData = translations[this.currentLang] || translations['zh-CN'];
    return langData[key] || translations['zh-CN'][key] || key;
  }

  // 获取所有可用语言
  getAvailableLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'zh-CN', name: '简体中文' },
      { code: 'zh-TW', name: '繁體中文' }
    ];
  }
}

// 导出单例
window.i18n = new I18n();
