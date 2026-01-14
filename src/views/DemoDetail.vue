<template>
  <div class="demo-detail">
    <div class="demo-header">
      <button class="btn-back" @click="goBack">
        ← 返回
      </button>
      <div class="demo-info">
        <h2 class="demo-title">{{ demo?.title || 'Demo' }}</h2>
        <div class="demo-meta">
          <span class="demo-category">{{ demo?.category?.name || '' }}</span>
          <span class="demo-description">{{ demo?.description || '' }}</span>
        </div>
      </div>
      <div class="demo-actions">
        <button v-if="!isEditMode" class="btn-toggle-edit" @click="toggleEditMode">
          ✏️ 编辑
        </button>
        <button v-if="isEditMode" class="btn-save" @click="saveDemo">
          💾 保存
        </button>
        <button v-if="isEditMode" class="btn-cancel" @click="cancelEdit">
          取消
        </button>
        <button class="btn-fullscreen" @click="toggleFullscreen">
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </button>
      </div>
    </div>

    <div class="demo-content" :class="{ 'fullscreen': isFullscreen, 'edit-mode': isEditMode }">
      <div v-if="isEditMode" class="editor-panel">
        <div class="editor-header">
          <h3>HTML 编辑器</h3>
          <button class="btn-run" @click="runCode">▶ 运行</button>
        </div>
        <div ref="editorContainer" class="monaco-editor"></div>
      </div>

      <div class="preview-panel">
        <div class="preview-header">
          <h3>预览</h3>
        </div>
        <iframe
          ref="previewFrame"
          class="preview-frame"
          :srcdoc="currentCode"
          sandbox="allow-scripts allow-same-origin"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as monaco from 'monaco-editor'
import { getDemoById } from '../data/demos.js'

const props = defineProps({
  id: String
})

const router = useRouter()
const route = useRoute()

const demo = ref(null)
const currentCode = ref('')
const originalCode = ref('')
const isEditMode = ref(false)
const isFullscreen = ref(false)
const editorContainer = ref(null)
const previewFrame = ref(null)
let editor = null

const loadDemo = async () => {
  const demoData = getDemoById(props.id)
  if (!demoData) {
    router.push('/')
    return
  }

  demo.value = demoData

  try {
    const response = await fetch(`/demos/${props.id}.html`)
    if (response.ok) {
      currentCode.value = await response.text()
      originalCode.value = currentCode.value
    } else {
      currentCode.value = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${demoData.title}</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${demoData.title}</h1>
    <p>${demoData.description}</p>
    <p>请在 /public/demos/ 目录下添加 ${props.id}.html 文件</p>
  </div>
</body>
</html>`
      originalCode.value = currentCode.value
    }
  } catch (error) {
    console.error('加载demo失败:', error)
    currentCode.value = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${demoData.title}</title>
</head>
<body>
  <h1>加载失败</h1>
  <p>无法加载 demo 文件</p>
</body>
</html>`
  }
}

const initEditor = () => {
  if (!editorContainer.value || editor) return

  editor = monaco.editor.create(editorContainer.value, {
    value: currentCode.value,
    language: 'html',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false
  })

  editor.onDidChangeModelContent(() => {
    currentCode.value = editor.getValue()
  })
}

const destroyEditor = () => {
  if (editor) {
    editor.dispose()
    editor = null
  }
}

const toggleEditMode = async () => {
  isEditMode.value = !isEditMode.value
  if (isEditMode.value) {
    await nextTick()
    initEditor()
  } else {
    destroyEditor()
  }
}

const runCode = () => {
  currentCode.value = editor.getValue()
}

const saveDemo = () => {
  originalCode.value = currentCode.value
  alert('代码已保存（注意：这只是前端演示，实际保存需要后端支持）')
  isEditMode.value = false
  destroyEditor()
}

const cancelEdit = () => {
  currentCode.value = originalCode.value
  isEditMode.value = false
  destroyEditor()
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const goBack = () => {
  router.push('/')
}

watch(() => route.path, (newPath) => {
  if (newPath.includes('/edit')) {
    isEditMode.value = true
  } else {
    isEditMode.value = false
  }
})

onMounted(async () => {
  await loadDemo()
  if (route.path.includes('/edit')) {
    isEditMode.value = true
    await nextTick()
    initEditor()
  }
})

onUnmounted(() => {
  destroyEditor()
})
</script>

<style scoped>
.demo-detail {
  animation: fadeIn 0.3s ease-in;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.demo-header {
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn-back {
  padding: 0.4rem 0.8rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  font-size: 0.85rem;
}

.btn-back:hover {
  background: #5568d3;
}

.demo-info {
  flex: 1;
  min-width: 200px;
}

.demo-title {
  font-size: 1.15rem;
  color: #333;
  margin-bottom: 0.4rem;
}

.demo-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.demo-category {
  display: inline-block;
  background: #e2e8f0;
  color: #4a5568;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
  width: fit-content;
}

.demo-description {
  color: #666;
  font-size: 0.8rem;
  line-height: 1.4;
}

.demo-actions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.btn-toggle-edit,
.btn-save,
.btn-cancel,
.btn-fullscreen,
.btn-run {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  font-size: 0.85rem;
}

.btn-toggle-edit {
  background: #48bb78;
  color: white;
}

.btn-toggle-edit:hover {
  background: #38a169;
}

.btn-save {
  background: #48bb78;
  color: white;
}

.btn-save:hover {
  background: #38a169;
}

.btn-cancel {
  background: #e53e3e;
  color: white;
}

.btn-cancel:hover {
  background: #c53030;
}

.btn-fullscreen {
  background: #667eea;
  color: white;
}

.btn-fullscreen:hover {
  background: #5568d3;
}

.btn-run {
  background: #38a169;
  color: white;
}

.btn-run:hover {
  background: #2f855a;
}

.demo-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.demo-content.edit-mode {
  grid-template-columns: 1fr 1fr;
}

.demo-content.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  grid-template-columns: 1fr;
  padding: 0.75rem;
  background: #f5f5f5;
  height: 100vh;
}

.demo-content.fullscreen .preview-panel {
  display: none;
}

.demo-content.fullscreen .editor-panel {
  height: calc(100vh - 1.5rem);
}

.editor-panel,
.preview-panel {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.editor-header,
.preview-header {
  background: #2d3748;
  color: white;
  padding: 0.5rem 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.editor-header h3,
.preview-header h3 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
}

.monaco-editor {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.preview-frame {
  flex: 1;
  border: none;
  width: 100%;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 1024px) {
  .demo-detail {
    height: auto;
  }

  .demo-content.edit-mode {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }

  .demo-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .demo-actions {
    width: 100%;
  }

  .demo-actions button {
    flex: 1;
  }
}
</style>
