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
      const files = evt.target.files; // 获取要上传的文件
      console.log(evt.target.files[0]);
      
      if (files.length <= 0) {
        return;
      }
      const list = [];
      Object.keys(files).forEach(index => {
        if (files[index].size > MAX_SIZE) {
          return alert("单个课程内容不能大于1G");
        }
        if (list.length < 10) {
          list.push(files[index]);
        } else {
          return;
        }
      });
      let ext, mimeType, options;
      for (const file of list) {
        ext = file.name.split(/\./g).pop();
        mimeType = MimeType.guess(ext);
        options = {
          "Content-Type": mimeType
        };
        console.log(file.name)
        console.log(file)
        client
          .putObjectFromBlob(bucket, file.name, file, options)
          .then(function(res) {
            console.log("上传成功");
          })
          .catch(function(err) {
            console.error(err);
          });
      }
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
