<template>
  <div class="group-new">
      <h3>分组</h3>
      <div class="wrapper">
          <div class="inner">
              <div class="desc">
                分组可更灵活的组织内容中多个音频的分类方式，让内容以章节的形式呈现。例如：
                <br>
                第一章，章节名称
                <br>
                音频1
                <br>
                音频2
                <br>
                <br>
                第二章，章节名称
                <br>
                音频3
            </div>
            <div class="list">
                <div v-for="(item, index) in list" class="name" :key="index">
                    <label>第{{getSeq(index)}}组</label>
                    <input type="text"
                        placeholder="请输入分组名"
                        v-model="item.groupname"
                        maxlength="40"
                        minlength="1"
                        required>
                    <svg class="icon remove" aria-hidden="true" style="color: #666;" v-on:click="list.splice(index, 1)">
                        <use xlink:href="#icon-iconfontjianhao"></use>
                    </svg>
                </div>
            </div>
            <div class="add-button">
                <span class="button red-button" v-bind:class="{'disabled-button': list.length>=10}" v-on:click="add">+ 增加分组</span>
            </div>
          </div>
      </div>
      <div class="footer">
          <span class="button red-button" v-on:click="save">保存</span>
          <span class="button gray-button" v-on:click="cancel">取消</span>
      </div>
  </div>
</template>

<script>
import { mapMutations } from "vuex";

export default {
  name: "audio-upload-group-new",
  data: () => ({
    list: [],
  }),
  components: {},
  methods: {
    ...mapMutations("audioUpload", ["createGroup"]),
    getSeq: function(index) {
      return index < 9 ? `0${index + 1}` : `${index + 1}`;
    },
    add: function() {
      if (this.list.length >=10) {
          return alert('最多可新增10个分组');
      }
      this.list.push({
        groupname: ""
      });
    },
    save: function() {
        const list = this.list.map(item => {
            item.groupname = item.groupname.trim();
            return item;
        }).filter(item => !!item.groupname);
        this.createGroup({list});
        this.$modal.hide('add-group-panel');
    },
    cancel: function() {
        this.$modal.hide('add-group-panel');
    }
  }
};
</script>

<style>
.group-new {
  position: relative;
  padding: 40px 36px 36px 36px;
  width: 100%;
  height: 'auto';
  min-height: 644px;
  box-sizing: border-box;
  overflow: auto;
}
.group-new h3 {
  position: absolute;
  left: 0;
  top: 40px;
  width: 100%;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #353535;
  padding-bottom: 18px;
}
.group-new .wrapper {
  width: 100%;
  height: 100%;
  padding-top: 40px;
  padding-bottom: 36px;
  box-sizing: border-box;
}
.group-new .inner {
    width: 100%;
    height: 100%;
    overflow: auto;
}
.group-new .desc {
  width: 100%;
  height: auto;
  background: #f9f9f9;
  border: 1px solid #eee;
  padding: 20px;
  box-sizing: border-box;
  font-size: 13px;
  color: #888;
  line-height: 24px;
  margin-bottom: 20px;
  text-align: left;
}
.group-new .name {
  margin-bottom: 10px;
}
.group-new .remove {
  margin-left: 8px;
  cursor: pointer;
}
.list {
  padding-bottom: 10px;
}
.add-button {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
.footer {
  position: absolute;
  width: 100%;
  left: 0;
  bottom: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.group-new .gray-button {
  margin-left: 20px;
  border: 1px solid #eee;
  background: #f9f9f9;
  color: #666;
}
.disabled-button {
    pointer-events: none;
    cursor: not-allowed;
    box-shadow: none;
    opacity: .65;
}
</style>
