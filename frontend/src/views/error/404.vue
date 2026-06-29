<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面未找到</h2>
      <p class="error-desc">您访问的页面不存在或已被移除</p>
      <el-space>
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
        <el-button @click="$router.go(-1)">返回上一页</el-button>
      </el-space>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;

  .error-content {
    text-align: center;

    .error-code {
      font-size: 120px;
      font-weight: 800;
      color: #409EFF;
      margin: 0;
      line-height: 1;
    }

    .error-title {
      font-size: 24px;
      color: #303133;
      margin: 16px 0 8px;
    }

    .error-desc {
      color: #909399;
      margin-bottom: 24px;
    }
  }
}
</style>
