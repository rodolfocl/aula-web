import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify, Loading } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Quasar, {
  plugins: { Notify, Loading },
  config: {
    brand: {
      primary: '#1565C0',
      secondary: '#26A69A',
    },
  },
})

app.mount('#app')