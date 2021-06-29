// import Vue from 'vue'
// import vuetify from '@/plugins/vuetify'
// import App from "./App.vue"

// Vue.config.productionTip = false

// new Vue({
//   vuetify,
//   render: h => h(App),
// }).$mount('#app')

import Vue from 'vue'
import Vuetify from 'vuetify'

Vue.use(Vuetify)

import MtaScheduler from "./components/MtaScheduler.vue"; 
 
export {
  MtaScheduler
};