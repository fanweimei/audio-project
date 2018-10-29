import Vue from 'vue';
import Vuex from 'vuex';
import audioUpload from './audio-upload';

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        audioUpload
    }
});