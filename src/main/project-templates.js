/**
 * 项目模板管理器 - OpenDev IDE
 * 阶段 3.4: 项目模板
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * 项目模板管理器
 */
class ProjectTemplates {
  constructor() {
    // 内置模板定义
    this.templates = {
      'react-vite': {
        id: 'react-vite',
        name: 'React + Vite',
        description: 'React + Vite 现代前端项目',
        category: 'frontend',
        files: {
          'package.json': JSON.stringify({
            name: '{{projectName}}',
            version: '1.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview'
            },
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0'
            },
            devDependencies: {
              '@vitejs/plugin-react': '^4.2.0',
              vite: '^5.0.0'
            }
          }, null, 2),
          'vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`,
          'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`,
          'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`,
          'src/App.jsx': `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>{{projectName}}</h1>
      <p>Counter: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}

export default App`,
          'src/index.css': `body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 20px;
}

button {
  padding: 8px 16px;
  cursor: pointer;
}`
        }
      },

      'vue-vite': {
        id: 'vue-vite',
        name: 'Vue 3 + Vite',
        description: 'Vue 3 + Vite 现代前端项目',
        category: 'frontend',
        files: {
          'package.json': JSON.stringify({
            name: '{{projectName}}',
            version: '1.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview'
            },
            dependencies: {
              vue: '^3.4.0'
            },
            devDependencies: {
              '@vitejs/plugin-vue': '^5.0.0',
              vite: '^5.0.0'
            }
          }, null, 2),
          'vite.config.js': `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000
  }
})`,
          'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`,
          'src/main.js': `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`,
          'src/App.vue': `<template>
  <div>
    <h1>{{projectName}}</h1>
    <p>Counter: {{ count }}</p>
    <button @click="count++">Increment</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<style>
body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 20px;
}
button {
  padding: 8px 16px;
  cursor: pointer;
}
</style>`
        }
      },

      'node-express': {
        id: 'node-express',
        name: 'Node.js + Express',
        description: 'Express 后端项目',
        category: 'backend',
        files: {
          'package.json': JSON.stringify({
            name: '{{projectName}}',
            version: '1.0.0',
            type: 'module',
            scripts: {
              start: 'node index.js',
              dev: 'node --watch index.js'
            },
            dependencies: {
              express: '^4.18.0',
              cors: '^2.8.5',
              dotenv: '^16.3.0'
            }
          }, null, 2),
          'index.js': `import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: '{{projectName}} API', status: 'running' })
})

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`)
})`,
          '.env': `PORT=3000
NODE_ENV=development`,
          'README.md': `# {{projectName}}

## 安装
npm install

## 运行
npm run dev`
        }
      },

      'python-flask': {
        id: 'python-flask',
        name: 'Python + Flask',
        description: 'Flask Web 框架项目',
        category: 'backend',
        files: {
          'app.py': `from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return jsonify({
        'message': '{{projectName}} API',
        'status': 'running'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)`,
          'requirements.txt': `flask>=2.3.0
python-dotenv>=1.0.0`,
          '.env': `FLASK_APP=app.py
FLASK_ENV=development`,
          'README.md': `# {{projectName}}

## 安装
pip install -r requirements.txt

## 运行
flask run`
        }
      },

      'blank': {
        id: 'blank',
        name: '空白项目',
        description: '最简单的项目结构',
        category: 'other',
        files: {
          'README.md': `# {{projectName}}

## 欢迎使用 OpenDev IDE

这是一个空白项目，开始你的开发吧！`,
          'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}}</title>
</head>
<body>
  <h1>Welcome to {{projectName}}</h1>
  <p>Start coding with OpenDev IDE!</p>
</body>
</html>`
        }
      }
    };
  }

  /**
   * 获取所有模板
   */
  getTemplates() {
    return Object.values(this.templates);
  }

  /**
   * 获取模板详情
   */
  getTemplate(id) {
    return this.templates[id] || null;
  }

  /**
   * 获取模板分类
   */
  getCategories() {
    const categories = new Set();
    for (const template of Object.values(this.templates)) {
      categories.add(template.category);
    }
    return Array.from(categories);
  }

  /**
   * 按分类获取模板
   */
  getTemplatesByCategory(category) {
    return this.getTemplates().filter(t => t.category === category);
  }

  /**
   * 创建项目
   */
  async createProject(templateId, projectName, targetDir) {
    const template = this.getTemplate(templateId);
    if (!template) {
      return { success: false, error: '模板不存在' };
    }

    // 创建项目目录
    const projectPath = path.join(targetDir, projectName);
    
    try {
      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
      }

      // 生成文件
      for (const [filePath, content] of Object.entries(template.files)) {
        const fullPath = path.join(projectPath, filePath);
        const dir = path.dirname(fullPath);
        
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // 替换占位符
        const finalContent = content.replace(/{{projectName}}/g, projectName);
        fs.writeFileSync(fullPath, finalContent, 'utf-8');
      }

      return { success: true, path: projectPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 安装依赖
   */
  async installDependencies(projectPath) {
    return new Promise((resolve) => {
      const packageJsonPath = path.join(projectPath, 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        resolve({ success: false, error: '没有 package.json' });
        return;
      }

      exec('npm install', { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: error.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  }
}

module.exports = { ProjectTemplates };
