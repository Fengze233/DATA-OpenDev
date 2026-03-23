/**
 * Git 管理器 - OpenDev IDE
 * 阶段 3.2: Git 面板
 * 
 * 使用 simple-git 进行 Git 操作
 */

const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');

/**
 * Git 管理器
 */
class GitManager {
  /**
   * @param {string} repoPath 仓库路径
   */
  constructor(repoPath) {
    this.repoPath = repoPath;
    this.git = repoPath ? simpleGit(repoPath) : null;
  }

  /**
   * 初始化仓库
   * @param {string} repoPath 
   */
  static async init(repoPath) {
    const git = simpleGit(repoPath);
    await git.init();
    return new GitManager(repoPath);
  }

  /**
   * 检查是否是 Git 仓库
   * @returns {Promise<boolean>}
   */
  async isRepo() {
    if (!this.git) return false;
    try {
      return await this.git.checkIsRepo();
    } catch {
      return false;
    }
  }

  /**
   * 获取仓库状态
   * @returns {Promise<GitStatus>}
   */
  async status() {
    if (!this.git) {
      return { notARepo: true };
    }

    try {
      const status = await this.git.status();
      return {
        notARepo: false,
        current: status.current,
        tracking: status.tracking,
        ahead: status.ahead,
        behind: status.behind,
        files: {
          created: status.created,
          deleted: status.deleted,
          modified: status.modified,
          renamed: status.renamed,
          staged: status.staged,
          not_added: status.not_added,
          conflicting: status.conflicting
        }
      };
    } catch (error) {
      return { notARepo: false, error: error.message };
    }
  }

  /**
   * 获取文件差异
   * @param {string} filePath 文件路径（可选）
   * @returns {Promise<string>}
   */
  async diff(filePath = '') {
    if (!this.git) return '';

    try {
      if (filePath) {
        return await this.git.diff([filePath]);
      }
      return await this.git.diff();
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  /**
   * 获取 staged 差异
   * @returns {Promise<string>}
   */
  async diffCached() {
    if (!this.git) return '';

    try {
      return await this.git.diff(['--cached']);
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  /**
   * 添加文件到暂存区
   * @param {string} filePath 文件路径
   * @returns {Promise<boolean>}
   */
  async add(filePath = '.') {
    if (!this.git) return false;

    try {
      await this.git.add(filePath);
      return true;
    } catch (error) {
      console.error('Git add error:', error.message);
      return false;
    }
  }

  /**
   * 提交更改
   * @param {string} message 提交信息
   * @returns {Promise<object>}
   */
  async commit(message) {
    if (!this.git) {
      return { success: false, error: 'Not a git repository' };
    }

    try {
      const result = await this.git.commit(message);
      return {
        success: true,
        commit: result.commit,
        summary: result.summary
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取分支列表
   * @returns {Promise<BranchInfo>}
   */
  async branches() {
    if (!this.git) {
      return { all: [], current: '' };
    }

    try {
      const branches = await this.git.branch();
      return {
        current: branches.current,
        all: branches.all,
        branches: branches.branches
      };
    } catch (error) {
      return { all: [], current: '', error: error.message };
    }
  }

  /**
   * 创建新分支
   * @param {string} branchName 分支名
   * @returns {Promise<boolean>}
   */
  async createBranch(branchName) {
    if (!this.git) return false;

    try {
      await this.git.branch([branchName]);
      return true;
    } catch (error) {
      console.error('Create branch error:', error.message);
      return false;
    }
  }

  /**
   * 切换分支
   * @param {string} branchName 分支名
   * @returns {Promise<boolean>}
   */
  async checkout(branchName) {
    if (!this.git) return false;

    try {
      await this.git.checkout(branchName);
      return true;
    } catch (error) {
      console.error('Checkout error:', error.message);
      return false;
    }
  }

  /**
   * 获取提交历史
   * @param {number} maxCount 最大数量
   * @returns {Promise<Array>}
   */
  async log(maxCount = 50) {
    if (!this.git) return [];

    try {
      const result = await this.git.log({ maxCount });
      return result.all || [];
    } catch (error) {
      console.error('Log error:', error.message);
      return [];
    }
  }

  /**
   * 获取特定提交的详情
   * @param {string} hash 提交哈希
   * @returns {Promise<object>}
   */
  async show(hash) {
    if (!this.git) return null;

    try {
      const result = await this.git.show([hash, '--stat']);
      return result;
    } catch (error) {
      console.error('Show error:', error.message);
      return null;
    }
  }

  /**
   * 拉取远程更新
   * @returns {Promise<object>}
   */
  async pull() {
    if (!this.git) {
      return { success: false, error: 'Not a git repository' };
    }

    try {
      const result = await this.git.pull();
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 推送到远程
   * @returns {Promise<object>}
   */
  async push() {
    if (!this.git) {
      return { success: false, error: 'Not a git repository' };
    }

    try {
      await this.git.push();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取远程列表
   * @returns {Promise<Array>}
   */
  async remotes() {
    if (!this.git) return [];

    try {
      const remotes = await this.git.getRemotes(true);
      return remotes || [];
    } catch (error) {
      console.error('Remotes error:', error.message);
      return [];
    }
  }

  /**
   * 获取文件/blame 信息
   * @param {string} filePath 
   * @returns {Promise<string>}
   */
  async blame(filePath) {
    if (!this.git) return '';

    try {
      return await this.git.raw(['blame', filePath]);
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  /**
   * 撤销文件更改
   * @param {string} filePath 
   * @returns {Promise<boolean>}
   */
  async checkoutFile(filePath) {
    if (!this.git) return false;

    try {
      await this.git.checkout(['--', filePath]);
      return true;
    } catch (error) {
      console.error('Checkout file error:', error.message);
      return false;
    }
  }

  /**
   * 重置暂存区
   * @param {string} filePath 可选文件路径
   * @returns {Promise<boolean>}
   */
  async reset(filePath = '') {
    if (!this.git) return false;

    try {
      if (filePath) {
        await this.git.reset(['HEAD', '--', filePath]);
      } else {
        await this.git.reset();
      }
      return true;
    } catch (error) {
      console.error('Reset error:', error.message);
      return false;
    }
  }
}

module.exports = { GitManager };
