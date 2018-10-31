<template>
  <div class="group">
    <div class="top">
        <div class="name">
            <label>第{{seq}}组</label>
            <input type="text"
              v-bind:value="groupname"
              placeholder="请输入分组名"
              v-on:change="updateGroupName({index, name: $event.target.value})"
              maxlength="40"
              minlength="1"
              required>
        </div>
        <div class="op">
            <div class="eclipse" v-on:mouseover="toggleOp(true)" v-on:mouseout="toggleOp(false)">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-more"></use>
                </svg>
            </div>
            <ul v-show="opVisible" v-on:mouseover="toggleOp(true)" v-on:mouseout="toggleOp(false)">
                <li>向上移动分组</li>
                <li>向下移动分组</li>
                <li>删除分组</li>
            </ul>
        </div>
    </div>
    <div class="center">
      <div v-if="!files || !files.length" class="no-data">拖动本组移动到某个分组下方，或把音频移入本分组</div>
      <draggable class="file-content" :list="files" :options="{group:'inner', animation:150, draggable: '.file'}" :no-transition-on-drag="true" @start="drag=true" @end="drag=false">
        <transition-group tag="div" class="file-content" name="list-complete" :css="true">
          <audio-upload-file v-for="(data, index) in files" v-bind:key="data.id"
            v-bind:index="index"
            v-bind:filename="data.filename"
            v-bind:listening="data.listening"
            v-bind:status="data.status"
            v-bind:last="index==files.length-1">
          </audio-upload-file>
        </transition-group>
      </draggable>
    </div>
    <div class="upload-btn">
        <span>上传文件</span>
    </div>
    <div class="bottom handler">
        <svg class="icon" aria-hidden="true">
            <use xlink:href="#icon-bars"></use>
        </svg>
    </div>
  </div>
</template>

<script>
import { mapMutations } from "vuex";
import draggable from 'vuedraggable';
import AudioUploadFile from "./file.vue";

export default {
  name: "audio-upload-group",
  data: () => ({
    opVisible: false,
    drag: false
  }),
  props: {
    index: Number,
    groupname: String,
    files: Array
  },
  computed: {
    seq: function() {
      return this.index < 10 ? "0" + (this.index + 1) : this.index + 1;
    }
  },
  components: {
    AudioUploadFile,
    draggable
  },
  methods: {
    ...mapMutations("audioUpload", ["updateGroupName"]),
    toggleOp(value) {
      setTimeout(() => {
        this.opVisible = value;
      }, 100);
    }
  }
};
</script>

<style>
.group {
  width: 100%;
  box-sizing: border-box;
  padding: 27px 20px 14px 20px;
  border: 1px solid #eee;
  border-bottom: 3px solid #eee;
  background: #fff;
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* margin-bottom: 26px; */
}
.name {
  color: #000;
  font-size: 15px;
  font-weight: bold;
  height: 36px;
  line-height: 36px;
}
.name label {
  display: inline-block;
  margin-right: 12px;
  width: 48px;
}
.name input {
  width: 360px;
  height: 36px;
  box-sizing: border-box;
  border: 1px solid #dcdcdc;
  padding: 0 14px;
  border-radius: 2px;
  color: #000;
  font-size: 15px;
  font-weight: bold;
}
.name input::-webkit-input-placeholder {
  color: #000;
  font-size: 15px;
  font-weight: bold;
}
.op {
  position: relative;
  width: 50px;
  height: 36px;
  box-sizing: border-box;
  border: 1px solid #dcdcdc;
  background: #f8f8f8;
  line-height: 36px;
  text-align: center;
}
.op ul {
  position: absolute;
  right: 0;
  top: 36px;
  width: 115px;
  border: 1px solid #7a9cd3;
  background: #fff;
}
.op li {
  width: 100%;
  box-sizing: border-box;
  height: 23px;
  line-height: 23px;
  text-align: center;
  padding-left: 14px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}
.op li:hover {
  background: #1e90ff;
  color: #fff;
}
.center {
  position: relative;
  width: 100%;
}
.center.gap {
  margin-bottom: 26px;
}
.center .no-data {
  position: absolute;
  left: 0;
  top: 26px;
  width: 100%;
  box-sizing: border-box;
  height: 60px;
  line-height: 60px;
  border: 2px dashed #dcdcdc;
  border-radius: 2px;
  text-align: center;
  color: #888;
  font-size: 14px;
}
.center .file-content {
  width: 100%;
  min-height: 60px;
  padding: 13px 0;
}
.upload-btn {
  height: 36px;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 36px;
}
.upload-btn span {
  float: right;
  width: 90px;
  height: 36px;
  border-radius: 2px;
  line-height: 36px;
  text-align: center;
  font-size: 14px;
  color: #fff;
  background: #f56555;
}
.bottom {
  display: flex;
  align-items: center;
  justify-content: center;
}
.bottom svg {
  cursor: pointer;
}
</style>
