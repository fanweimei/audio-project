<template>
  <div id="app">
    <audio-upload></audio-upload>
  </div>
</template>

<script>
import AudioUpload from './components/audio-upload/index.vue'

export default {
  name: 'app',
  components: {
    AudioUpload
  }
}
</script>

<style>
#app {
  width: 100%;
  height: 100%;
}
</style>
