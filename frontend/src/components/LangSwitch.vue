<template>
  <span class="lang-bar">
    <span v-for="opt in options" :key="opt.key" class="lang-item" :class="{ active: locale === opt.key }" @click="switchTo(opt.key)">
      {{ opt.icon }} {{ opt.short }}
    </span>
  </span>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { setLang } from '@/locales'

const { locale } = useI18n()

const options = [
  { key: 'zh', icon: '🇨🇳', short: '中' },
  { key: 'th', icon: '🇹🇭', short: '泰' },
  { key: 'en', icon: '🇬🇧', short: 'EN' },
]

function switchTo(lang) {
  setLang(lang)
}
</script>

<style scoped>
.lang-bar { display: flex; align-items: center; gap: 2px; }
.lang-item { cursor: pointer; padding: 2px 6px; border-radius: 3px; font-size: 12px; opacity: .5; transition: opacity .2s; }
.lang-item:hover, .lang-item.active { opacity: 1; font-weight: 600; }
</style>
