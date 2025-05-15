<template>
<div class="page-wrapper">
<div class="insert-operations-card">
    <h2>إدراج العمليات</h2>

    <!-- أجرة موظف الصيانة -->
    <div class="fee-input">
    <label for="technicianFee">أجرة موظف الصيانة لكل عملية:</label>
    <input id="technicianFee" type="number" min="0" v-model.number="technicianFee" />
    </div>

    <!-- زر إضافة عملية جديدة -->
    <button class="main-button" @click="showAddModal = true">إضافة عملية جديدة</button>

    <!-- نافذة إدخال العملية الجديدة -->
    <div v-if="showAddModal" class="modal-overlay">
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <h2 id="modalTitle">إدخال عملية صيانة جديدة</h2>

        <form @submit.prevent="addOperation">
        <div class="form-group">
            <label for="technician">اختر موظف الصيانة:</label>
            <select id="technician" v-model="newOperation.technician_username" required>
            <option value="" disabled>اختر الفني</option>
            <option v-for="tech in technicians" :key="tech.username" :value="tech.username">
                {{ tech.full_name }}
            </option>
            </select>
        </div>

        <div class="form-group">
            <label for="customerName">اسم المشترك:</label>
            <input id="customerName" v-model.trim="newOperation.customer_name" type="text" required placeholder="أدخل اسم المشترك" />
        </div>

        <div class="form-group">
            <label for="paidAmount">المبلغ المدفوع:</label>
            <input id="paidAmount" v-model.number="newOperation.paid_amount" type="number" min="0" required placeholder="أدخل المبلغ المدفوع" />
        </div>

        <div class="form-group">
            <label for="technicianFeeInput">أجرة موظف الصيانة:</label>
            <input id="technicianFeeInput" :value="technicianFee" type="number" readonly />
        </div>

        <div class="form-group">
            <label for="notes">ملاحظات (اختياري):</label>
            <textarea id="notes" v-model.trim="newOperation.notes" placeholder="أدخل ملاحظات إن وجدت" rows="3"></textarea>
        </div>

        <div class="form-group">
            <label for="timestamp">تاريخ ووقت العملية:</label>
            <input id="timestamp" :value="currentTimestampFormatted" type="text" readonly />
        </div>

        <div class="form-actions center">
            <button type="submit" class="btn-save">حفظ العملية</button>
            <button type="button" @click="closeAddModal" class="btn-cancel">إلغاء</button>
        </div>
        </form>
    </div>
    </div>

    <!-- الفلتر حسب موظف الصيانة -->
    <div class="filter-group">
    <label for="filterTechnician">فلتر حسب موظف الصيانة:</label>
    <select id="filterTechnician" v-model="filterTechnician">
        <option value="all">الكل</option>
        <option v-for="tech in technicians" :key="tech.username" :value="tech.username">
        {{ tech.full_name }}
        </option>
    </select>
    </div>

    <!-- جدول العمليات -->
    <table class="operations-table">
    <thead>
        <tr>
        <th>حذف</th>
        <th>تاريخ العملية</th>
        <th>ملاحظات</th>
        <th>أجرة الفني</th>
        <th>المبلغ المدفوع</th>
        <th>اسم المشترك</th>
        <th>موظف الصيانة</th>
        <th>رقم</th>
        </tr>
    </thead>
    <tbody>
        <tr v-for="(operation, index) in filteredOperations" :key="operation.id">
        <td><button class="btn-delete" @click="deleteOperation(operation.id)">حذف</button></td>
        <td>{{ formatDate(operation.timestamp) }}</td>
        <td>{{ operation.notes || '-' }}</td>
        <td>{{ operation.technician_fee }}</td>
        <td>{{ operation.paid_amount }}</td>
        <td>{{ operation.customer_name }}</td>
        <td>{{ getTechnicianFullName(operation.technician_username) }}</td>
        <td>{{ index + 1 }}</td>
        </tr>
    </tbody>
    </table>

    <!-- المجموعات بتنسيق خاص -->
    <div class="totals-row">
    <div class="totals-card">
        مجموع أجور الفنيين لكل موظف<br />
        {{ getTechnicianFullName(filterTechnician) }} : {{ totalFees.toFixed(2) }}
    </div>
    <div class="totals-card">
        مجموع المبالغ المدفوعة لكل موظف<br />
        {{ getTechnicianFullName(filterTechnician) }} : {{ totalPayments.toFixed(2) }}
    </div>
    <button class="btn-delete-all" @click="deleteAllOperations">حذف جميع عمليات موظف</button>
    </div>
</div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from "../supabase/client"

const technicianFee = ref(0)
const showAddModal = ref(false)
const filterTechnician = ref('all')
const currentTimestampFormatted = new Date().toLocaleString('ar-EG')

const newOperation = ref({
technician_username: '',
customer_name: '',
paid_amount: null,
technician_fee: null,
notes: ''
})

const technicians = ref([])
const operations = ref([])

const fetchTechnicians = async () => {
const { data, error } = await supabase.from('technicians').select('*').eq('approved', true)
if (!error) technicians.value = data
}

const fetchOperations = async () => {
const { data, error } = await supabase.from('customer_operations').select('*')
if (!error) operations.value = data
}

const getTechnicianFullName = (username) => {
const tech = technicians.value.find(t => t.username === username)
return tech ? tech.full_name : username
}

const formatDate = (dateString) => {
if (!dateString) return '-'
return new Date(dateString).toLocaleString('ar-EG')
}

const filteredOperations = computed(() => {
if (filterTechnician.value === 'all') return operations.value
return operations.value.filter(op => op.technician_username === filterTechnician.value)
})

const totalPayments = computed(() => {
return filteredOperations.value.reduce((sum, op) => sum + (op.paid_amount || 0), 0)
})

const totalFees = computed(() => {
return filteredOperations.value.reduce((sum, op) => sum + (op.technician_fee || 0), 0)
})

const addOperation = async () => {
newOperation.value.technician_fee = technicianFee.value
const { error } = await supabase.from('customer_operations').insert([
{
    ...newOperation.value,
    timestamp: new Date().toISOString()
}
])
if (!error) {
showAddModal.value = false
fetchOperations()
newOperation.value = {
    technician_username: '',
    customer_name: '',
    paid_amount: null,
    technician_fee: null,
    notes: ''
}
}
}

const deleteOperation = async (id) => {
const { error } = await supabase.from('customer_operations').delete().eq('id', id)
if (!error) fetchOperations()
}

const deleteAllOperations = async () => {
if (filterTechnician.value === 'all') return
const { error } = await supabase.from('customer_operations').delete().eq('technician_username', filterTechnician.value)
if (!error) fetchOperations()
}

const closeAddModal = () => {
showAddModal.value = false
}

onMounted(() => {
fetchTechnicians()
fetchOperations()
})
</script>

<style scoped>
.totals-row {
display: flex;
justify-content: space-around;
align-items: center;
gap: 1rem;
margin-top: 2rem;
flex-wrap: wrap;
}

.totals-card {
background-color: #f6fdf6;
border: 2px solid #A0C878;
border-radius: 12px;
padding: 1rem 2rem;
text-align: center;
font-weight: bold;
font-size: 1.1rem;
color: #393E46;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
min-width: 230px;
}

.btn-delete-all {
background-color: #f46a25;
color: white;
font-weight: bold;
border: none;
padding: 0.9rem 2rem;
border-radius: 12px;
cursor: pointer;
margin-top: 1rem;
transition: background-color 0.3s ease;
}

.btn-delete-all:hover {
background-color: #d85b1f;
}
</style>
