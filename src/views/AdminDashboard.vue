<template>
<div class="page-wrapper">
    <div class="admin-card">
    <div class="header">
        <h2>لوحة المدير</h2>
        <button class="logout-button" @click="logout">تسجيل الخروج</button>
    </div>

    <!-- الطلبات -->
    <div class="section">
        <h2>الطلبات بانتظار الموافقة</h2>
        <div v-if="pendingList.length === 0" class="empty-msg">لا توجد طلبات حالياً.</div>
        <div v-for="(user, index) in pendingList" :key="index" class="request-box">
        <p><strong>الاسم:</strong> {{ user.full_name }}</p>
        <p><strong>اسم المستخدم:</strong> {{ user.username }}</p>
        <div class="btns">
            <button class="approve-btn" @click="approve(user)">موافقة</button>
            <button class="reject-btn" @click="reject(user)">رفض</button>
        </div>
        </div>
    </div>

    <!-- جدول الموظفين -->
    <div class="section">
        <h2>الموظفون المعتمدون</h2>
        <table class="employee-table">
        <thead>
            <tr>
            <th>الاسم الثلاثي</th>
            <th>اسم المستخدم</th>
            <th>حذف</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(tech, i) in technicianList" :key="i">
            <td @click="showOperations(tech)" style="cursor: pointer;">{{ tech.full_name }}</td>
            <td @click="showOperations(tech)" style="cursor: pointer;">{{ tech.username }}</td>
            <td><button class="delete-btn" @click="openDeleteModal(tech)">🗑️</button></td>
            </tr>
        </tbody>
        </table>
    </div>

    <!-- سجل العمليات -->
    <div v-if="selectedTechnician" class="section">
        <h2>سجل العمليات للموظف: {{ selectedTechnician.full_name }}</h2>
        <div class="wire-summary">
        <p v-for="(total, wire) in wireTotals" :key="wire">
            {{ wire }} = {{ total }} واير 
        </p>
        </div>
        <div class="record-actions">
        <button class="hide-btn" @click="clearSelection">إخفاء السجل</button>
        <button class="clear-ops-btn" @click="openClearOpsModal">🗑️ حذف كل العمليات</button>
        </div>

        <table class="operations-table">
        <thead>
            <tr>
            <th>التاريخ</th>
            <th>الوقت</th>
            <th>نوع الواير</th>
            <th>الكمية</th>
            <th>ملاحظات</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(op, i) in selectedOperations" :key="i">
            <td>{{ formatDate(op.timestamp) }}</td>
            <td>{{ formatTime(op.timestamp) }}</td>
            <td>{{ op.wire }}</td>
            <td>{{ op.quantity }}</td>
            <td>{{ op.notes || '-' }}</td>
            </tr>
        </tbody>
        </table>
    </div>
    </div>

    <!-- نافذة تأكيد حذف الموظف -->
    <div v-if="showDeleteModal" class="modal-overlay">
    <div class="modal-content">
        <h3>تأكيد حذف الموظف</h3>
        <p>هل أنت متأكد من حذف الموظف <strong>{{ technicianToDelete?.full_name }}</strong> وجميع بياناته؟</p>
        <div class="modal-buttons">
        <button class="confirm-btn" @click="confirmDelete">نعم، احذف</button>
        <button class="cancel-btn" @click="cancelDelete">إلغاء</button>
        </div>
    </div>
    </div>

    <!-- نافذة تأكيد حذف العمليات -->
    <div v-if="showClearOpsModal" class="modal-overlay">
    <div class="modal-content">
        <h3>تأكيد حذف العمليات</h3>
        <p>هل أنت متأكد من حذف جميع العمليات الخاصة بالموظف <strong>{{ selectedTechnician?.full_name }}</strong>؟</p>
        <div class="modal-buttons">
        <button class="confirm-btn" @click="confirmClearOperations">نعم، احذف</button>
        <button class="cancel-btn" @click="cancelClearOps">إلغاء</button>
        </div>
    </div>
    </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase/client'

const router = useRouter()
const pendingList = ref([])
const technicianList = ref([])
const selectedTechnician = ref(null)
const selectedOperations = ref([])
const showDeleteModal = ref(false)
const technicianToDelete = ref(null)
const showClearOpsModal = ref(false)

const fetchData = async () => {
    const { data: pending, error: pendingError } = await supabase
    .from("technicians")
    .select("*")
    .eq("approved", false)
    if (!pendingError) pendingList.value = pending

    const { data: approved, error: approvedError } = await supabase
    .from("technicians")
    .select("*")
    .eq("approved", true)
    if (!approvedError) technicianList.value = approved
}

onMounted(fetchData)

const approve = async (user) => {
    const { error } = await supabase
    .from("technicians")
    .update({ approved: true })
    .eq("id", user.id)
    if (!error) {
    pendingList.value = pendingList.value.filter(u => u.id !== user.id)
    technicianList.value.push({ ...user, approved: true })
    }
}

const reject = async (user) => {
    const { error } = await supabase
    .from("technicians")
    .delete()
    .eq("id", user.id)
    if (!error) {
    pendingList.value = pendingList.value.filter(u => u.id !== user.id)
    }
}

const logout = () => {
    localStorage.removeItem("role")
    localStorage.removeItem("username")
    router.push("/")
}

const formatDate = iso => new Date(iso).toLocaleDateString("ar-IQ")
const formatTime = iso => new Date(iso).toLocaleTimeString("ar-IQ")

const showOperations = async (tech) => {
    const { data, error } = await supabase
    .from("operations")
    .select("*")
    .eq("technician_username", tech.username)
    .order("timestamp", { ascending: false })
    if (!error) {
    selectedTechnician.value = tech
    selectedOperations.value = data
    }
}

const clearSelection = () => {
    selectedTechnician.value = null
    selectedOperations.value = []
}

const openDeleteModal = (tech) => {
    technicianToDelete.value = tech
    showDeleteModal.value = true
}

const cancelDelete = () => {
    showDeleteModal.value = false
    technicianToDelete.value = null
}

const confirmDelete = async () => {
    if (!technicianToDelete.value) return
    await supabase.from("technicians").delete().eq("id", technicianToDelete.value.id)
    await supabase.from("operations").delete().eq("technician_username", technicianToDelete.value.username)
    technicianList.value = technicianList.value.filter(t => t.id !== technicianToDelete.value.id)
    if (selectedTechnician.value?.id === technicianToDelete.value.id) {
    clearSelection()
    }
    cancelDelete()
}

const openClearOpsModal = () => {
    showClearOpsModal.value = true
}

const cancelClearOps = () => {
    showClearOpsModal.value = false
}

const confirmClearOperations = async () => {
    if (!selectedTechnician.value) return
    await supabase.from("operations").delete().eq("technician_username", selectedTechnician.value.username)
    selectedOperations.value = []
    cancelClearOps()
}
// Sum Wire
const wireTotals = computed(() => {
    const totals = {};
    selectedOperations.value.forEach(op => {
    if (op.wire) {
    if (!totals[op.wire]) {
    totals[op.wire] = 0;
    }
    totals[op.wire] += Number(op.quantity) || 0;
}
});
    return totals;
});


</script>


<style scoped>
.page-wrapper {
position: absolute;
top: 0; left: 0; right: 0; bottom: 0;
background: linear-gradient(135deg, #A0C878, #9FB3DF);
display: flex;
justify-content: center;
align-items: flex-start;
padding: 40px 20px;
overflow-y: auto;
}

.admin-card {
background: #fff;
border-radius: 20px;
width: 100%;
max-width: 1000px;
padding: 30px;
box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
color: #393E46;
direction: rtl;
text-align: right;
}

.header {
display: flex;
justify-content: space-between;
align-items: center;
}

.logout-button {
background: #9FB3DF;
border: none;
padding: 10px 20px;
color: white;
border-radius: 8px;
font-weight: bold;
cursor: pointer;
}

.section {
margin-top: 30px;
}

h1, h2 {
color: #393E46;
}

.empty-msg {
color: #555;
font-size: 15px;
}

.request-box {
border: 1px solid #ddd;
border-radius: 12px;
padding: 15px;
margin-bottom: 15px;
background: #f9f9f9;
}

.btns {
margin-top: 10px;
display: flex;
gap: 10px;
}

.approve-btn {
background-color: #A0C878;
color: white;
border: none;
padding: 8px 16px;
border-radius: 8px;
cursor: pointer;
}

.reject-btn {
background-color: #e26565;
color: white;
border: none;
padding: 8px 16px;
border-radius: 8px;
cursor: pointer;
}

.employee-table, .operations-table {
width: 100%;
border-collapse: collapse;
font-size: 15px;
margin-top: 10px;
}

.employee-table th,
.employee-table td,
.operations-table th,
.operations-table td {
border: 1px solid #ccc;
padding: 10px;
text-align: center;
}

.employee-table tr:hover td {
background-color: #f0f8f5;
cursor: pointer;
}

.hide-btn {
background-color: #9FB3DF;
border: none;
padding: 8px 16px;
color: white;
border-radius: 8px;
font-weight: bold;
margin-bottom: 10px;
cursor: pointer;
}

.clear-ops-btn {
background-color: #e67e22;
color: white;
border: none;
padding: 8px 16px;
border-radius: 8px;
cursor: pointer;
font-weight: bold;
}

.delete-btn {
background-color: #e74c3c;
color: white;
border: none;
padding: 6px 12px;
border-radius: 8px;
cursor: pointer;
}

.modal-overlay {
position: fixed;
top: 0; left: 0; right: 0; bottom: 0;
background-color: rgba(0, 0, 0, 0.5);
z-index: 99;
display: flex;
justify-content: center;
align-items: center;
}

.modal-content {
background: white;
padding: 30px;
border-radius: 15px;
width: 90%;
max-width: 400px;
text-align: center;
box-shadow: 0 10px 25px rgba(0,0,0,0.2);
color: #393E46;
}

.modal-content h3 {
font-size: 22px;
margin-bottom: 10px;
color: #393E46;
}

.modal-content p {
font-size: 16px;
color: #555;
margin: 0;
}

.modal-content strong {
color: #393E46;
}

.wire-summary {
    background-color: #f9f9f9;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-weight: bold;
    color: #333;
}


.modal-buttons {
display: flex;
justify-content: center;
gap: 15px;
margin-top: 20px;
}

.confirm-btn {
background-color: #e74c3c;
color: white;
border: none;
padding: 10px 20px;
border-radius: 8px;
font-weight: bold;
cursor: pointer;
}

.cancel-btn {
background-color: #9FB3DF;
color: white;
border: none;
padding: 10px 20px;
border-radius: 8px;
font-weight: bold;
cursor: pointer;
}
</style>
