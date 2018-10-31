import Vue from 'vue'
import VModal from 'vue-js-modal'
import store from './store';
import App from './App.vue';

Vue.config.productionTip = false;
Vue.use(VModal);

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
