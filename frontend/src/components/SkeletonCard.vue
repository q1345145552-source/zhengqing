<template>
  <div class="skeleton-card">
    <div class="sk-header">
      <div class="sk-line sk-title"></div>
      <div class="sk-line sk-tag"></div>
    </div>
    <div class="sk-body">
      <div class="sk-line sk-text"></div>
      <div class="sk-line sk-text short"></div>
    </div>
    <div class="sk-footer">
      <div class="sk-line sk-num"></div>
      <div class="sk-line sk-num"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  background: #fff; border-radius: 10px; padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  animation: shimmer 1.5s infinite;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
}
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.sk-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.sk-line { border-radius: 4px; background: #e0e0e0; }
.sk-title { width: 200px; height: 20px; }
.sk-tag { width: 80px; height: 24px; border-radius: 4px; }
.sk-body { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.sk-text { width: 280px; height: 14px; }
.sk-text.short { width: 160px; }
.sk-footer { display: flex; gap: 16px; }
.sk-num { width: 100px; height: 16px; }
</style>
