<template>
  <div class="file">
    <label>{{seq}}.</label>
    <div class="content" v-bind:class="{'last': last}">
        <div class="filename">
            <input type="text" v-bind:value="filename" placeholder="请输入文件名">
            <div class="bar"></div>
        </div>
        <div class="status">
            <template v-if="status==1">
                <svg class="icon loading" aria-hidden="true">
                    <use xlink:href="#icon-loading"></use>
                </svg>
                <span style="color: #dcdcdc;">等待上传...</span>
            </template>
            <template v-else-if="status==2">
                <svg class="icon loading" aria-hidden="true">
                    <use xlink:href="#icon-loading"></use>
                </svg>
                <span style="color: #dcdcdc;">上传中...</span>
            </template>
            <template v-else-if="status==3">
                <svg class="icon" aria-hidden="true" style="font-size:20px;">
                    <use xlink:href="#icon-duigouxiao"></use>
                </svg>
            </template>
            <template v-else-if="status==4">
                <span
                    v-bind:class="{reload: reloadVisible, fail: !reloadVisible}"
                    v-on:mouseover="reloadVisible=true"
                    v-on:mouseout="reloadVisible=false">
                    {{reloadVisible ? '重新上传' : '上传失败'}}
                </span>
            </template>
        </div>
        <div class="desc">简介(选填)</div>
        <div class="listening">
            <input type="checkbox" v-bind:checked="listening">
            设为试听
        </div>
        <div class="close">
            <svg class="icon" aria-hidden="true" style="font-size:20px;">
                <use xlink:href="#icon-cuowu"></use>
            </svg>
        </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "audio-upload-file",
  data: () => ({
      reloadVisible: false
  }),
  props: {
    index: Number,
    filename: String,
    listening: Boolean,
    status: Number,
    last: false
  },
  computed: {
    seq: function() {
      return this.index < 10 ? '0'+(this.index+1) : (this.index+1)
    }
  },
  methods: {},
  components: {}
};
</script>

<style>
.file {
  width: 100%;
  height: 56px;
  display: grid;
  grid-template-columns: 50px auto;
}
.file label {
  text-align: center;
  line-height: 56px;
  font-size: 14px;
  color: #353535;
  font-weight: bold;
  font-family:MicrosoftYaHei-Bold;
}
.content {
  display: flex;
  align-items: center;
  /* flex: 1; */
  height: 100%;
  box-sizing: border-box;
  padding: 0 10px;
  padding-right: 20px;
  border: 1px solid #dcdcdc;
  border-bottom: none;
}
.content.last {
    border-bottom: 1px solid #dcdcdc;
}
.filename {
  position: relative;
  width: 330px;
  height: 36px;
  margin-right: 10px;
}
.filename input {
  width: 100%;
  height: 100%;
  padding: 0 13px;
  border: 1px solid #dcdcdc;
  box-sizing: border-box;
  line-height: 34px;
  font-size: 14px;
  color: #000;
}
.status {
  width: 90px;
  height: 36px;
  margin-right: 10px;
  font-size: 14px;
  line-height: 36px;
}
.status svg {
  margin-right: 6px;
  font-size: 16px;
}
@keyframes loading {
    from {
        transform:rotate(360deg);
    }
    to {
        transform:rotate(0deg);
    }
}
.status svg.loading {
    animation: loading 0.5s linear infinite reverse;
}
.fail {
    color: red;
    cursor: pointer;
}
.reload , .desc {
  display: inline-block;
  width: 90px;
  height: 36px;
  box-sizing: border-box;
  border: 1px solid #dcdcdc;
  line-height: 34px;
  text-align: center;
  color: #666;
  cursor: pointer;
}
.desc {
  margin-right: 8px;
  font-size: 14px;
}
.listening {
    margin-right: 40px;
    font-size: 12px;
}
.close {
    cursor: pointer;
}
</style>
