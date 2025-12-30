import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/Schriftarten/Schriftart.css'
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
import App from './App.vue'
import router from './router'

const app = createApp(App)
  app.use(Toast, {
    timeout: 3000,
    position: "top-right",
    closeOnClick: true,
    pauseOnHover: true,
    hideProgressBar: false
  })

app.use(createPinia())
app.use(router)

app.mount('#app')
