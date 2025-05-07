import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/LoginPage.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import TechnicianDashboard from '../views/TechnicianDashboard.vue'

const routes = [
    { path: '/', component: LoginPage },
    { path: '/admin', component: AdminDashboard },
    { path: '/dashboard', component: TechnicianDashboard }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
