/**
 * Git 面板 - OpenDev IDE
 * 阶段 3.2: Git 面板
 */

// Git 面板 CSS
const gitPanelCSS = `
  .git-panel {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #1e1e1e;
    color: #ccc;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .git-panel-header {
    padding: 10px 15px;
    background: #252526;
    border-bottom: 1px solid #3c3c3c;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .git-panel-header h3 {
    margin: 0;
    font-size: 14px;
    color: #fff;
  }
  
  .git-panel-tabs {
    display: flex;
    background: #252526;
    border-bottom: 1px solid #3c3c3c;
  }
  
  .git-tab {
    padding: 8px 16px;
    cursor: pointer;
    font-size: 12px;
    color: #888;
    border-bottom: 2px solid transparent;
  }
  
  .git-tab:hover {
    color: #ccc;
  }
  
  .git-tab.active {
    color: #fff;
    border-bottom-color: #007acc;
  }
  
  .git-panel-content {
    flex: 1;
    overflow: auto;
    padding: 10px;
  }
  
  .git-section {
    margin-bottom: 15px;
  }
  
  .git-section-title {
    font-size: 11px;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 8px;
  }
  
  .git-file-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .git-file-item {
    padding: 4px 8px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  .git-file-item:hover {
    background: #2a2d2e;
  }
  
  .git-file-icon {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }
  
  .git-file-icon.modified { background: #e9c13a; }
  .git-file-icon.added { background: #4ec9b0; }
  .git-file-icon.deleted { background: #f14c4c; }
  .git-file-icon.renamed { background: #9b9b9b; }
  .git-file-icon.untracked { background: #9b9b9b; }
  
  .git-branch-badge {
    display: inline-block;
    padding: 2px 6px;
    background: #0e639c;
    color: white;
    border-radius: 3px;
    font-size: 11px;
  }
  
  .git-commit-form {
    padding: 10px;
    background: #252526;
    border-top: 1px solid #3c3c3c;
  }
  
  .git-commit-input {
    width: 100%;
    padding: 8px;
    background: #3c3c3c;
    border: 1px solid #555;
    color: #ccc;
    font-size: 12px;
    resize: none;
    margin-bottom: 8px;
  }
  
  .git-commit-input:focus {
    outline: none;
    border-color: #007acc;
  }
  
  .git-actions {
    display: flex;
    gap: 8px;
  }
  
  .git-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .git-btn-primary {
    background: #0e639c;
    color: white;
  }
  
  .git-btn-primary:hover {
    background: #1177bb;
  }
  
  .git-btn-secondary {
    background: #3c3c3c;
    color: #ccc;
  }
  
  .git-btn-secondary:hover {
    background: #4a4a4a;
  }
  
  .git-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .git-commit-item {
    padding: 8px;
    border-bottom: 1px solid #3c3c3c;
  }
  
  .git-commit-hash {
    font-family: monospace;
    color: #4ec9b0;
    font-size: 11px;
  }
  
  .git-commit-message {
    color: #ccc;
    font-size: 12px;
    margin-top: 4px;
  }
  
  .git-commit-date {
    color: #666;
    font-size: 10px;
    margin-top: 2px;
  }
  
  .git-diff-view {
    background: #1e1e1e;
    font-family: monospace;
    font-size: 11px;
    padding: 10px;
    white-space: pre-wrap;
    overflow: auto;
  }
  
  .git-diff-add {
    background: rgba(78, 201, 176, 0.2);
    color: #4ec9b0;
  }
  
  .git-diff-remove {
    background: rgba(241, 76, 76, 0.2);
    color: #f14c4c;
  }
  
  .git-empty {
    text-align: center;
    color: #666;
    padding: 30px;
  }
  
  .git-loading {
    text-align: center;
    color: #888;
    padding: 20px;
  }
`;

// Git 面板管理器类
class GitPanel {
  constructor(opendevAPI) {
    this.api = opendevAPI;
    this.currentTab = 'changes';
    this.status = null;
    this.branches = null;
    this.commits = [];
    this.currentDiff = null;
  }

  // 初始化面板
  async init(container) {
    this.container = container;
    this.render();
    await this.refresh();
  }

  // 渲染面板
  render() {
    this.container.innerHTML = `
      <style>${gitPanelCSS}</style>
      <div class="git-panel">
        <div class="git-panel-header">
          <h3>📂 Git</h3>
          <button class="git-btn git-btn-secondary" onclick="gitPanel.refresh()">🔄</button>
        </div>
        
        <div class="git-panel-tabs">
          <div class="git-tab active" data-tab="changes" onclick="gitPanel.switchTab('changes')">变更</div>
          <div class="git-tab" data-tab="branches" onclick="gitPanel.switchTab('branches')">分支</div>
          <div class="git-tab" data-tab="history" onclick="gitPanel.switchTab('history')">历史</div>
        </div>
        
        <div class="git-panel-content" id="git-content">
          <div class="git-loading">加载中...</div>
        </div>
        
        <div class="git-commit-form">
          <textarea class="git-commit-input" id="git-commit-msg" placeholder="提交信息..." rows="2"></textarea>
          <div class="git-actions">
            <button class="git-btn git-btn-primary" onclick="gitPanel.commit()">提交</button>
            <button class="git-btn git-btn-secondary" onclick="gitPanel.pull()">拉取</button>
            <button class="git-btn git-btn-secondary" onclick="gitPanel.push()">推送</button>
          </div>
        </div>
      </div>
    `;
  }

  // 切换标签页
  switchTab(tab) {
    this.currentTab = tab;
    
    // 更新标签样式
    this.container.querySelectorAll('.git-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    
    this.renderContent();
  }

  // 刷新数据
  async refresh() {
    const content = this.container.querySelector('#git-content');
    content.innerHTML = '<div class="git-loading">加载中...</div>';
    
    try {
      // 获取状态
      const statusResult = await this.api.git.status();
      this.status = statusResult;
      
      // 获取分支
      const branchResult = await this.api.git.branches();
      this.branches = branchResult;
      
      // 获取提交历史
      const logResult = await this.api.git.log(50);
      this.commits = logResult;
      
      this.renderContent();
    } catch (error) {
      content.innerHTML = `<div class="git-empty">错误: ${error.message}</div>`;
    }
  }

  // 渲染内容
  renderContent() {
    const content = this.container.querySelector('#git-content');
    
    switch (this.currentTab) {
      case 'changes':
        this.renderChanges(content);
        break;
      case 'branches':
        this.renderBranches(content);
        break;
      case 'history':
        this.renderHistory(content);
        break;
    }
  }

  // 渲染变更
  renderChanges(container) {
    if (!this.status || this.status.notARepo) {
      container.innerHTML = '<div class="git-empty">不是 Git 仓库</div>';
      return;
    }

    const files = this.status.files;
    const allFiles = [
      ...(files.staged || []).map(f => ({ path: f, status: 'staged' })),
      ...(files.modified || []).map(f => ({ path: f, status: 'modified' })),
      ...(files.not_added || []).map(f => ({ path: f, status: 'untracked' })),
      ...(files.deleted || []).map(f => ({ path: f, status: 'deleted' }))
    ];

    if (allFiles.length === 0) {
      container.innerHTML = '<div class="git-empty">工作区干净</div>';
      return;
    }

    container.innerHTML = `
      <div class="git-section">
        <div class="git-section-title">暂存区 (${files.staged?.length || 0})</div>
        <ul class="git-file-list">
          ${(files.staged || []).map(f => `
            <li class="git-file-item" onclick="gitPanel.showDiff('${f}')">
              <span class="git-file-icon staged"></span>
              <span>${f}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      
      <div class="git-section">
        <div class="git-section-title">未暂存 (${(files.modified?.length || 0) + (files.not_added?.length || 0)})</div>
        <ul class="git-file-list">
          ${(files.modified || []).map(f => `
            <li class="git-file-item" onclick="gitPanel.showDiff('${f}')">
              <span class="git-file-icon modified"></span>
              <span>${f}</span>
            </li>
          `).join('')}
          ${(files.not_added || []).map(f => `
            <li class="git-file-item">
              <span class="git-file-icon untracked"></span>
              <span>${f}</span>
            </li>
          `).join('')}
          ${(files.deleted || []).map(f => `
            <li class="git-file-item">
              <span class="git-file-icon deleted"></span>
              <span>${f}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  // 渲染分支
  renderBranches(container) {
    if (!this.branches || this.branches.error) {
      container.innerHTML = '<div class="git-empty">无法获取分支</div>';
      return;
    }

    container.innerHTML = `
      <div class="git-section">
        <div class="git-section-title">当前分支</div>
        <div style="padding: 8px;">
          <span class="git-branch-badge">${this.branches.current}</span>
        </div>
      </div>
      
      <div class="git-section">
        <div class="git-section-title">所有分支</div>
        <ul class="git-file-list">
          ${this.branches.all.map(branch => `
            <li class="git-file-item" onclick="gitPanel.checkout('${branch}')">
              <span>${branch === this.branches.current ? '✓ ' : ''}${branch}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  // 渲染历史
  renderHistory(container) {
    if (!this.commits || this.commits.length === 0) {
      container.innerHTML = '<div class="git-empty">暂无提交历史</div>';
      return;
    }

    container.innerHTML = `
      <div class="git-section">
        <ul class="git-file-list">
          ${this.commits.map(commit => `
            <li class="git-commit-item">
              <div class="git-commit-hash">${commit.hash.substring(0, 7)}</div>
              <div class="git-commit-message">${commit.message}</div>
              <div class="git-commit-date">${new Date(commit.date).toLocaleString()}</div>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  // 提交
  async commit() {
    const msgInput = this.container.querySelector('#git-commit-msg');
    const message = msgInput.value.trim();
    
    if (!message) {
      alert('请输入提交信息');
      return;
    }

    const result = await this.api.git.commit(message);
    if (result.success) {
      msgInput.value = '';
      await this.refresh();
    } else {
      alert('提交失败: ' + result.error);
    }
  }

  // 拉取
  async pull() {
    const result = await this.api.git.pull();
    if (result.success) {
      await this.refresh();
    } else {
      alert('拉取失败: ' + result.error);
    }
  }

  // 推送
  async push() {
    const result = await this.api.git.push();
    if (result.success) {
      await this.refresh();
    } else {
      alert('推送失败: ' + result.error);
    }
  }

  // 切换分支
  async checkout(branch) {
    if (branch === this.branches.current) return;
    
    const result = await this.api.git.checkout(branch);
    if (result.success) {
      await this.refresh();
    } else {
      alert('切换失败: ' + result.error);
    }
  }

  // 显示差异
  async showDiff(filePath) {
    const result = await this.api.git.diff(filePath);
    const content = this.container.querySelector('#git-content');
    
    content.innerHTML = `
      <div class="git-diff-view">${result || '无差异'}</div>
      <button class="git-btn git-btn-secondary" onclick="gitPanel.switchTab('changes')" style="margin: 10px;">返回</button>
    `;
  }
}

// 全局实例
let gitPanel = null;

// 初始化函数
function initGitPanel(opendevAPI, container) {
  gitPanel = new GitPanel(opendevAPI);
  window.gitPanel = gitPanel; // 暴露到全局
  return gitPanel.init(container);
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GitPanel, initGitPanel, gitPanelCSS };
}
