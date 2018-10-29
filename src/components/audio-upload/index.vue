<template>
  <div class="audio-upload">
    <div class="top-btn">
        <span>上传文件</span>
        <span>将音频分组</span>
    </div>
    <p class="tip tip1">一次可上传多个音频，最多上传100个。每个音频文件需小于200M，支持mp3，wav，arm文件格式</p>
    <p class="tip tip2">修改音频标题前的序号可改变音频文件的排序</p>
    <draggable :list="dataset" :options="{group:'outer', animation:150, handle: '.handler', draggable: '.group'}" :no-transition-on-drag="true" @start="drag=true" @end="drag=false">
        <transition-group :name="!drag? 'list-complete' : null" :css="true">
            <template v-for="(data, index) in dataset" >
                <audio-upload-group :key="data.id"
                    v-bind:index="index"
                    v-bind:groupname="data.groupname"
                    v-bind:files="data.files">
                </audio-upload-group>
            </template>
            
        </transition-group>
    </draggable>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import draggable from 'vuedraggable';
import AudioUploadGroup from './group.vue';

export default {
  name: 'audio-upload',
  data: () => ({
      drag: false
  }),
  computed: {
      ...mapState('audioUpload', {
          dataset: state => state.dataset
      }),
  },
  components: {
      draggable,
      AudioUploadGroup
  },
  methods: {
  }
}
</script>

<style>
.audio-upload {
    margin-left: 20px;
    padding-top: 31px;
    width: 800px;
    cursor: pointer;
}
.top-btn {
    margin-bottom: 19px;
}
.top-btn span {
    display: inline-block;
    width: 90px;
    height: 36px;
    border-radius: 2px;
    line-height: 36px;
    text-align: center;
    font-size: 14px;
    color: #fff;
    background: #F56555;
}
.top-btn span:first-child {
    margin-right: 20px;
}
.tip {
    font-size: 13px;
    color: #888;
}
.tip1 {
    margin-bottom: 39px;
}
.tip2 {
    margin-bottom: 19px;
}
</style>
