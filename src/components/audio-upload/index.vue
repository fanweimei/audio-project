<template>
  <div class="audio-upload">
    <div class="top-btn">
        <input type="file"
            multiple="multiple"
            accept="audio/mp3, audio/wav, audio/arm"
            v-on:change="uploadFile">
        <span class="button red-button">上传文件</span>
        <span class="button red-button" v-on:click="addGroup">将音频分组</span>
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
    <modal name="add-group-panel" width="542px" height="auto">
        <audio-upload-group-new></audio-upload-group-new>
    </modal>
  </div>
</template>

<script>
import { mapState } from "vuex";
import draggable from "vuedraggable";
import { BosClient, MimeType } from "bce-sdk-js";
import Uploader from "../../uploader";
import AudioUploadGroup from "./group.vue";
import AudioUploadGroupNew from "./group-new.vue";

const config = {
  endpoint: "https://gz.bcebos.com",
  credentials: {
    ak: "ed7791fdac8c41c28f45f8adaf629400 ",
    sk: "d5a46f9df08244e3ad2e8b15b4ef5b37"
  }
};
let bucket = "web-sa";
let key = "hello.js";
let client = new BosClient(config);
const MAX_SIZE = 1024 * 1024 * 1024;
const uploader = new Uploader({
  bos_endpoint: "https://gz.bcebos.com",
  bos_bucket: "web-sa",
  bos_ak: "ed7791fdac8c41c28f45f8adaf629400 ",
  bos_sk: "d5a46f9df08244e3ad2e8b15b4ef5b37",
  max_retries: 1,
  auto_start: true,
  max_selected_size: 10,
  max_file_size: "1Gb",
  bos_multipart_min_size: "10Mb",
  bos_multipart_parallel: 1,
  bos_task_parallel: 3,
  chunk_size: "4Mb",
  bos_multipart_auto_continue: true,
  init: {
    FilesAdded: function(_, files) {
      console.log("filesadd:", files);
    },
    FilesFilter: function(_, files) {
      console.log("filesfilter:", files);
    },
    UploadProgress: function(_, file, progress, event) {
      // 文件的上传进度
      console.log("progress:", file, progress);
    },
    NetworkSpeed: function(_, bytes, time, pendings) {
      var speed = bytes / time; // 上传速度
      var leftTime = pendings / speed; // 剩余时间
      console.log("NetworkSpeed:", leftTime);
    },
    FileUploaded: function(_, file, info) {
      // 文件上传成功之后，调用这个函数
      var url = [bos_endpoint, info.body.bucket, info.body.object].join("/");
      console.log("FileLoaded:", url);
    },
    Error: function(_, error, file) {
      // 如果上传的过程中出错了，调用这个函数
      console.error(error, file);
    },
    UploadComplete: function() {
      // 队列里面的文件上传结束了，调用这个函数
      console.warn("over....");
    },
    UploadResume: function(_, file, partList, event) {
      // 断点续传生效时，调用这个函数，partList表示上次中断时，已上传完成的分块列表
      console.log("uploadResume:", file, partList);
    },
    UploadResumeError: function(_, file, error, event) {
      // 尝试进行断点续传失败时，调用这个函数
      console.log("UploadResumeError:", file);
    }
  }
});

export default {
  name: "audio-upload",
  data: () => ({
    drag: false
  }),
  computed: {
    ...mapState("audioUpload", {
      dataset: state => state.dataset
    })
  },
  components: {
    draggable,
    AudioUploadGroup,
    AudioUploadGroupNew
  },
  methods: {
    addGroup: function() {
      this.$modal.show("add-group-panel");
    },
    uploadFile: function(evt) {
      uploader.addFiles(evt);
    }
  }
};
</script>

<style>
.audio-upload {
  margin-left: 20px;
  padding-top: 31px;
  width: 800px;
  cursor: pointer;
}
.top-btn {
  position: relative;
  margin-bottom: 19px;
}
.top-btn input[type="file"] {
  position: absolute;
  left: 0;
  top: 0;
  width: 90px;
  height: 36px;
  opacity: 0;
}
.button {
  display: inline-block;
  width: 90px;
  height: 36px;
  border-radius: 2px;
  line-height: 36px;
  text-align: center;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
}
.red-button {
  background: #f56555;
}
.top-btn span:last-child {
  margin-left: 20px;
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
