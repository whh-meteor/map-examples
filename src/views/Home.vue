<template>
  <div class="home">
    <div class="sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">地图功能</h2>
        <p class="sidebar-subtitle">示例集合</p>
      </div>
      <nav class="sidebar-nav">
        <a
          v-for="category in demoCategories"
          :key="category.id"
          class="nav-item"
          :class="{ active: activeCategory === category.id }"
          @click="scrollToCategory(category.id)"
        >
          <span class="nav-icon">{{ category.icon || '📁' }}</span>
          <span class="nav-text">{{ category.name }}</span>
          <span class="nav-count">{{ category.demos.length }}</span>
        </a>
      </nav>
    </div>

    <div class="main-content" ref="mainContent">
      <div
        v-for="category in demoCategories"
        :key="category.id"
        :id="`category-${category.id}`"
        class="category-section"
      >
        <div class="category-header">
          <h3 class="category-title">{{ category.name }}</h3>
          <p class="category-description">{{ category.description }}</p>
          <div class="category-divider"></div>
        </div>

        <div v-if="category.demos.length > 0" class="demo-grid">
          <div
            v-for="demo in category.demos"
            :key="demo.id"
            class="demo-card"
            @click="viewDemo(demo.id)"
          >
            <div v-if="demo.image" class="demo-image-container">
              <img :src="demo.image" :alt="demo.title" class="demo-image">
            </div>
            <div v-else class="demo-icon">{{ demo.icon || '📍' }}</div>
            <h4 class="demo-title">{{ demo.title }}</h4>
            <p class="demo-description">{{ demo.description }}</p>
            <div class="demo-actions">
              <button class="btn-view" @click.stop="viewDemo(demo.id)">查看</button>
              <button class="btn-edit" @click.stop="editDemo(demo.id)">编辑</button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>暂无示例</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { demoCategories } from '../data/demos.js'

const router = useRouter()
const mainContent = ref(null)
const activeCategory = ref('basic')

const viewDemo = (id) => {
  router.push(`/demo/${id}`)
}

const editDemo = (id) => {
  router.push(`/demo/${id}/edit`)
}

const scrollToCategory = (categoryId) => {
  activeCategory.value = categoryId
  const element = document.getElementById(`category-${categoryId}`)
  if (element && mainContent.value) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const handleScroll = () => {
  if (!mainContent.value) return

  const sections = demoCategories.map(cat => ({
    id: cat.id,
    element: document.getElementById(`category-${cat.id}`)
  }))

  const containerTop = mainContent.value.scrollTop
  const containerHeight = mainContent.value.clientHeight

  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i]
    if (section.element) {
      const rect = section.element.getBoundingClientRect()
      const containerRect = mainContent.value.getBoundingClientRect()
      const relativeTop = rect.top - containerRect.top

      if (relativeTop <= containerHeight / 2) {
        activeCategory.value = section.id
        break
      }
    }
  }
}

onMounted(() => {
  if (mainContent.value) {
    mainContent.value.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  if (mainContent.value) {
    mainContent.value.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.home {
  display: flex;
  height: 100%;
  overflow: hidden;
  gap: 0;
}

.sidebar {
  width: 240px;
  background: #2d3748;
  color: white;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-title {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.sidebar-subtitle {
  font-size: 0.85rem;
  opacity: 0.7;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background: rgba(102, 126, 234, 0.2);
  color: white;
  border-left-color: #667eea;
}

.nav-icon {
  font-size: 1.25rem;
  margin-right: 0.75rem;
}

.nav-text {
  flex: 1;
  font-size: 0.95rem;
}

.nav-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  scroll-behavior: smooth;
}

.category-section {
  margin-bottom: 2rem;
}

.category-header {
  margin-bottom: 1.25rem;
}

.category-title {
  font-size: 1.5rem;
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.category-description {
  color: #718096;
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
}

.category-divider {
  height: 2px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 1px;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.demo-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.demo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.demo-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.demo-image-container {
  width: 100%;
  height: 120px;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 1rem;
  background: #f0f0f0;
}

.demo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.demo-card:hover .demo-image {
  transform: scale(1.05);
}

.demo-title {
  font-size: 1.05rem;
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.demo-description {
  color: #718096;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.demo-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-view,
.btn-edit {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  font-size: 0.85rem;
}

.btn-view {
  background: #667eea;
  color: white;
}

.btn-view:hover {
  background: #5568d3;
}

.btn-edit {
  background: #48bb78;
  color: white;
}

.btn-edit:hover {
  background: #38a169;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #a0aec0;
  font-size: 0.95rem;
  background: white;
  border-radius: 8px;
  border: 2px dashed #e2e8f0;
}

@media (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }

  .demo-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .home {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    max-height: 200px;
  }

  .sidebar-nav {
    display: flex;
    overflow-x: auto;
    padding: 0.5rem;
  }

  .nav-item {
    flex-shrink: 0;
    border-left: none;
    border-bottom: 3px solid transparent;
    padding: 0.5rem 0.75rem;
  }

  .nav-item.active {
    border-left: none;
    border-bottom-color: #667eea;
  }

  .demo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
