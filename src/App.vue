<template>
  <div id="app">
    <header class="header">
      <div class="container">
        <h1 class="logo">🗺️ 地图功能示例集合</h1>
        <nav class="nav">
          <router-link to="/" class="nav-link">首页</router-link>
        </nav>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.6rem 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.container {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.2rem;
  font-weight: 600;
}

.nav {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  transition: background 0.3s;
  font-size: 0.9rem;
}

.nav-link:hover {
  background: rgba(255,255,255,0.2);
}

.main {
  max-width: 100%;
  /* margin: 0.5rem auto; */
  /* padding: 0 1rem; */
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
