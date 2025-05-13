import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/LoginPage.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import TechnicianDashboard from '../views/TechnicianDashboard.vue'
import InsertOperations from '../views/InsertOperations.vue'

const routes = [
    { path: '/', component: LoginPage },
    { path: '/admin', component: AdminDashboard },
    { path: '/dashboard', component: TechnicianDashboard },
    { path: '/insert-operations', name: 'InsertOperations', component: InsertOperations,
    meta: { requiresAuth: true } // حسب إعدادات المشروع
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const userRole = localStorage.getItem('role');

    if (requiresAuth) {
        if (userRole === 'admin') {
            next();
        } else {
            next({ path: '/' }); 
        }
    } else {
        next();
    }
})

export default router
