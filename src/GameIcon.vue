<script setup>
defineProps({ name: { type: String, required: true }, size: { type: Number, default: 24 } });
</script>

<template>
  <svg class="game-icon" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'battle' || name === 'power'">
      <path d="m4 4 16 16M20 4 4 20"/><path d="m4 8 4-4M16 20l4-4M16 4l4 4M4 16l4 4"/>
    </template>
    <template v-else-if="name === 'elite' || name === 'guard'">
      <path d="M12 2 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6z"/><path v-if="name === 'elite'" d="m8 13 2.5-5L12 11l1.5-3L16 13l-4 4z"/><path v-else d="m8 12 3 3 5-6"/>
    </template>
    <template v-else-if="name === 'augment' || name === 'combo'">
      <path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/><path v-if="name === 'combo'" d="M18 3v3M16.5 4.5h3M5 18v3M3.5 19.5h3"/>
    </template>
    <template v-else-if="name === 'rest' || name === 'fire'">
      <path d="M12 22c-4.5 0-7-2.9-7-6.3 0-3.2 2.5-5 3-8.7 2.2 1.3 3.6 2.4 4 4.4.8-2.3.3-4 0-6 3.1 2.4 5 5.5 5 10.6C17 20.1 15.1 22 12 22Z"/><path d="M12 21c-1.8 0-3-1.4-3-3 0-1.4 1-2.6 3-4 2 1.4 3 2.6 3 4 0 1.6-1.2 3-3 3Z"/>
    </template>
    <template v-else-if="name === 'event'">
      <path d="M9 8a3 3 0 0 1 6 0c0 2-3 2.5-3 5"/><path d="M12 17v.5"/><path d="M4 4 2 7l2 3M20 4l2 3-2 3M4 20l-2-3 2-3M20 20l2-3-2-3"/>
    </template>
    <template v-else-if="name === 'boss'">
      <path d="m3 7 4 3 5-7 5 7 4-3-2 12H5z"/><path d="M6 21h12"/><path d="M9 15h.01M15 15h.01"/>
    </template>
    <template v-else-if="name === 'time'">
      <circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>
    </template>
    <template v-else-if="name === 'vitality' || name === 'heal'">
      <path d="M20.8 8.5c0 4.1-5.2 8.4-8.8 11.2C8.4 16.9 3.2 12.6 3.2 8.5a4.5 4.5 0 0 1 8.8-1.1 4.5 4.5 0 0 1 8.8 1.1Z"/><path v-if="name === 'vitality'" d="M12 9v5M9.5 11.5h5"/>
    </template>
    <template v-else-if="name === 'regen'">
      <path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 14"/><path d="M5 19c2-4 6-7 11-10"/>
    </template>
    <template v-else-if="name === 'rainbow'">
      <path d="m12 2 8 10-8 10L4 12z"/><path d="m4 12 8-3 8 3-8 3z"/>
    </template>
    <template v-else-if="name === 'monster'">
      <path d="M5 16V9l3-2 4 2 4-2 3 2v7l-7 5z"/><path d="M8 4v3M16 4v3M9 13h.01M15 13h.01"/>
    </template>
    <template v-else-if="name === 'check'">
      <path d="m4 12 5 5L20 6"/>
    </template>
    <template v-else-if="name === 'arrow'">
      <path d="M4 12h16m-6-6 6 6-6 6"/>
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5M12 16h.01"/>
    </template>
  </svg>
</template>
