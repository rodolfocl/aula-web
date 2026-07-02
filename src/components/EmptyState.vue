<template>
  <div style="display: flex; flex-direction: column; align-items: center;
              justify-content: center; padding: 80px 20px; width: 100%; text-align: center;">
    <div style="font-size: 56px; margin-bottom: 16px; opacity: 0.3;">{{ icon }}</div>
    <p style="font-size: 15px; color: #AAAAAA; margin: 0;">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '📋' },
  message: { type: String, default: 'No hay datos disponibles' }
})
</script>