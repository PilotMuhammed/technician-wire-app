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
            <input
            id="customerName"
            v-model.trim="newOperation.customer_name"
            type="text"
            required
            placeholder="أدخل اسم المشترك"
            />
        </div>

        <div class="form-group">
            <label for="paidAmount">المبلغ المدفوع:</label>
            <input
            id="paidAmount"
            v-model.number="newOperation.paid_amount"
            type="number"
            min="0"
            required
            placeholder="أدخل المبلغ المدفوع"
            />
        </div>

        <div class="form-group">
            <label for="technicianFeeInput">أجرة موظف الصيانة:</label>
            <input id="technicianFeeInput" :value="technicianFee" type="number" readonly />
        </div>

        <div class="form-group">
            <label for="notes">ملاحظات (اختياري):</label>
            <textarea
            id="notes"
            v-model.trim="newOperation.notes"
            placeholder="أدخل ملاحظات إن وجدت"
            rows="3"
            ></textarea>
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
        <option value="">الكل</option>
        <option v-for="tech in technicians" :key="'filter-'+tech.username" :value="tech.username">
        {{ tech.full_name }}
        </option>
    </select>
    </div>

    <!-- جدول عرض العمليات -->
    <div class="operations-table-container">
    <table class="operations-table">
        <thead>
        <tr>
            <th>رقم</th>
            <th>موظف الصيانة</th>
            <th>اسم المشترك</th>
            <th>المبلغ المدفوع</th>
            <th>أجرة الفني</th>
            <th>ملاحظات</th>
            <th>تاريخ العملية</th>
            <th>حذف</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(op, index) in filteredOperations" :key="op.id">
            <td>{{ index + 1 }}</td>
            <td>{{ op.technician_username }}</td>
            <td>{{ op.customer_name }}</td>
            <td>{{ op.paid_amount }}</td>
            <td>{{ op.technician_fee }}</td>
            <td>{{ op.notes || '-' }}</td>
            <td>{{ formatTimestamp(op.timestamp) }}</td>
            <td>
            <button @click="confirmDeleteSingle(op)" title="حذف العملية" class="btn-delete">
                حذف
            </button>
            </td>
        </tr>
        <tr v-if="filteredOperations.length === 0">
            <td colspan="8" class="no-data">لا توجد عمليات لعرضها</td>
        </tr>
        </tbody>
    </table>
    </div>

    <!-- أزرار أسفل الجدول -->
    <div class="bottom-buttons">
    <!-- زر حذف العمليات لموظف معين -->
    <button @click="showDeleteAllModal = true" class="btn-delete-all">
        حذف جميع عمليات موظف
    </button>

    <!-- ملخص المبالغ المدفوعة لكل موظف -->
    <div class="summary-box">
        <h3>مجموع المبالغ المدفوعة لكل موظف</h3>
        <ul>
        <li v-for="[tech, data] in Object.entries(paymentSummary)" :key="'paid-'+tech">
            {{ tech }} : {{ data.totalPaid.toFixed(2) }}
        </li>
        <li v-if="Object.keys(paymentSummary).length === 0" class="no-data">لا توجد بيانات</li>
        </ul>
    </div>

    <!-- ملخص أجور الفنيين لكل موظف -->
    <div class="summary-box">
        <h3>مجموع أجور الفنيين لكل موظف</h3>
        <ul>
        <li v-for="[tech, data] in Object.entries(paymentSummary)" :key="'fee-'+tech">
            {{ tech }} : {{ data.totalFee.toFixed(2) }}
        </li>
        <li v-if="Object.keys(paymentSummary).length === 0" class="no-data">لا توجد بيانات</li>
        </ul>
    </div>
    </div>

    <!-- نافذة تأكيد حذف عملية واحدة -->
    <div v-if="showConfirmDeleteSingleModal" class="modal-overlay">
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="confirmDeleteTitle">
        <h3 id="confirmDeleteTitle">تأكيد حذف العملية</h3>
        <p>هل أنت متأكد من حذف هذه العملية؟</p>

        <div class="form-actions center">
        <button @click="deleteSingleOperation" class="btn-delete">حذف</button>
        <button @click="showConfirmDeleteSingleModal = false" class="btn-cancel">إلغاء</button>
        </div>
    </div>
    </div>

    <!-- نافذة حذف جميع عمليات موظف -->
    <div v-if="showDeleteAllModal" class="modal-overlay">
    <div class="modal-content" role="dialog" aria-modal=true aria-labelledby="deleteAllTitle">
        <h3 id='deleteAllTitle'>حذف جميع عمليات موظف</h3>

        <label for='deleteTechnician'>اختر موظف الحذف:</label><br />
        <select style="background-color: white; color: black; font-size: large;" id='deleteTechnician' v-model='deleteTechnicianUsername' required >
        <option value="" disabled>اختر الموظف</option>
        <option v-for='tech in technicians' :key="'del-'+tech.username" :value='tech.username'>
            {{ tech.full_name }}
        </option>
        </select>

        <p>هل أنت متأكد من حذف جميع العمليات لهذا الموظف؟ هذا الإجراء لا يمكن التراجع عنه.</p>

        <div class="form-actions center">
        <button @click='deleteAllOperationsForTechnician' class='btn-delete'>حذف</button>
        <button @click='cancelDeleteAll' class='btn-cancel'>إلغاء</button>
        </div>

    </div>
    </div>

    <!-- رسائل الحالة -->
    <div
    v-if='statusMessage.visible'
    class='status-popup'
    :class="{ success : statusMessage.type==='success', error : statusMessage.type==='error' }"
    role='alert'
    aria-live='assertive'
    >
    {{ statusMessage.text }}
    </div>

</div><!-- insert-operations-card -->
</div><!-- page-wrapper -->
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from "../supabase/client"

const technicianFee = ref(5)
const technicians = ref([])
const operations = ref([])
const filterTechnician = ref('')
const showAddModal = ref(false)

const newOperation = ref({
technician_username: '',
customer_name: '',
paid_amount: null,
technician_fee: null,
notes: '',
})

const currentTimestampFormatted = new Date().toLocaleString('ar-EG', {
year: 'numeric',
month: '2-digit',
day: '2-digit',
hour: '2-digit',
minute: '2-digit',
second: '2-digit',
})

const showConfirmDeleteSingleModal = ref(false)
const operationToDelete = ref(null)

const showDeleteAllModal = ref(false)
const deleteTechnicianUsername = ref('')

const statusMessage = ref({ visible: false, text: '', type: 'success' })

async function fetchTechnicians() {
const { data, error } = await supabase
.from('technicians')
.select('full_name', 'username')
.eq('approved', true)
.order('username', { ascending: true })

if (error) {
showStatus('خطأ في جلب بيانات الفنيين.', 'error')
return
}
technicians.value = data || []
}

async function fetchOperations() {
let query = supabase.from('operations').select('*').order('timestamp', { ascending: false })
if (filterTechnician.value) {
query = query.eq('technician_username', filterTechnician.value)
}
const { data, error } = await query
if (error) {
showStatus('خطأ في جلب العمليات.', 'error')
return
}
operations.value = data || []
}

function showStatus(text, type = 'success', duration = 4000) {
statusMessage.value = { visible: true, text, type }
setTimeout(() => {
statusMessage.value.visible = false
statusMessage.value.text = ''
statusMessage.value.type = 'success'
}, duration)
}

function formatTimestamp(ts) {
if (!ts) return '-'
const d = new Date(ts)
return d.toLocaleString('ar-EG', {
year: 'numeric',
month: '2-digit',
day: '2-digit',
hour: '2-digit',
minute: '2-digit',
second: '2-digit',
})
}

async function addOperation() {
if (!newOperation.value.technician_username ||
    !newOperation.value.customer_name ||
    newOperation.value.paid_amount === null ||
    newOperation.value.paid_amount === '' ||
    isNaN(newOperation.value.paid_amount)) {
showStatus('يرجى تعبئة جميع الحقول المطلوبة.', 'error')
return
}

newOperation.value.technician_fee = technicianFee.value

const { error } = await supabase.from('operations').insert([
{
    technician_username: newOperation.value.technician_username,
    customer_name: newOperation.value.customer_name.trim(),
    paid_amount: newOperation.value.paid_amount,
    technician_fee: newOperation.value.technician_fee,
    notes: newOperation.value.notes.trim() || null,
},
])

if (error) {
showStatus('حدث خطأ أثناء حفظ العملية.', 'error')
return
}

showStatus('تمت إضافة العملية بنجاح.', 'success')
closeAddModal()
await fetchOperations()
}

function closeAddModal() {
showAddModal.value = false
newOperation.value = {
technician_username: '',
customer_name: '',
paid_amount: null,
technician_fee: null,
notes: '',
}
}

function confirmDeleteSingle(op) {
operationToDelete.value = op
showConfirmDeleteSingleModal.value = true
}

async function deleteSingleOperation() {
if (!operationToDelete.value) return

const { error } = await supabase.from('operations').delete().eq('id', operationToDelete.value.id)
if (error) {
showStatus('خطأ في حذف العملية.', 'error')
return
}

showStatus('تم حذف العملية بنجاح.', 'success')
showConfirmDeleteSingleModal.value = false
operationToDelete.value = null
await fetchOperations()
}

async function deleteAllOperationsForTechnician() {
if (!deleteTechnicianUsername.value) {
showStatus('يرجى اختيار موظف للحذف.', 'error')
return
}

const { error } = await supabase.from('operations').delete().eq('technician_username', deleteTechnicianUsername.value)

if (error) {
showStatus('حدث خطأ أثناء حذف العمليات.', 'error')
return
}

showStatus(`تم حذف جميع عمليات ${deleteTechnicianUsername.value} بنجاح.`, 'success')
showDeleteAllModal.value = false
deleteTechnicianUsername.value = ''
await fetchOperations()
}

function cancelDeleteAll() {
showDeleteAllModal.value = false
deleteTechnicianUsername.value = ''
}

const paymentSummary = computed(() => {
const summary = {}
operations.value.forEach((op) => {
const tech = op.technician_username || 'غير محدد'
if (!summary[tech]) summary[tech] = { totalPaid: 0, totalFee: 0 }
summary[tech].totalPaid += Number(op.paid_amount || 0)
summary[tech].totalFee += Number(op.technician_fee || 0)
})
return summary
})

const filteredOperations = computed(() => {
return filterTechnician.value
? operations.value.filter((op) => op.technician_username === filterTechnician.value)
: operations.value
})

onMounted(async () => {
await fetchTechnicians()
await fetchOperations()
})
</script>

<style scoped>

/* صفحة الإدخال */
.page-wrapper {
position: absolute;
top:0; left:0; right:0; bottom:0;
background: linear-gradient(135deg, #A0C878, #9FB3DF);
display:flex;
justify-content:center;
align-items:flex-start;
padding:40px 20px;
overflow-y:auto;
}

.insert-operations-card {
background:#fff;
border-radius:20px;
width:100%;
max-width:1000px;
padding:30px;
box-shadow:0 10px 25px rgba(0,0,0,0.1);
color:#393E46;
direction: rtl;
text-align:right;
}

h2 {
margin-bottom:20px;
}

/* حقل أجرة الفني */
.fee-input {
margin-bottom:20px;
}
.fee-input label {
font-weight:bolder;
}
.fee-input input[type='number'] {
border:1px solid #9fb3df;
border-radius:5px;
padding:5px 10px;
width:60px;
background-color: white;
color: black;
font-size: larger;
}

/* أزرار */
.main-button,
.btn-save,
.btn-cancel,
.btn-delete,
.btn-delete-all {
padding:10px 20px;
border:none;
border-radius:8px;
cursor:pointer;
font-weight:bold;
font-size:16px;
transition: background-color .3s ease;
}

.main-button,
.btn-save {
background-color:#a0c878;
color:white;
}
.main-button:hover,
.btn-save:hover {
background-color:#8eb964;
}

.btn-cancel {
background-color:#9fb3df;
color:white;
}
.btn-cancel:hover {
background-color:#7fa1d1;
}

.btn-delete {
background-color:#e74c3c;
color:white;
}
.btn-delete:hover {
background-color:#c0392b;
}

.btn-delete-all {
background-color:#e67e22;
color:white;
}
.btn-delete-all:hover {
background-color:#d35400;
}

/* نموذج الإدخال */
.form-group {
margin-bottom:15px;
}
.form-group label {
font-weight:bold;
}
.form-group input[type='text'],
.form-group input[type='number'],
.form-group select,
.form-group textarea {
width:100%;
padding:6px;
border-radius:5px;
border:1px solid #9fb3df;
box-sizing:border-box;
background-color: white;
color: black;
font-size: larger;
}
.form-group input[readonly] {
background-color:#f0f0f0;
color: #594100;
font-weight: bold;
}

/* تنسيق الفلاتر */
.filter-group {
margin-top:30px;
margin-bottom:15px;
}
.filter-group label {
font-weight:bold;
}
.filter-group select {
padding:6px; 
border-radius:5px; 
border:1px solid #9fb3df;
background-color: white;
color: black;
font-size: larger;
}

/* جدول العمليات */
.operations-table-container {
overflow-x:auto;
}
.operations-table-container::-webkit-scrollbar {
height:8px;
}
.operations-table-container::-webkit-scrollbar-thumb {
background-color:#a0c878;
border-radius:4px;
}
.operations-table {
width:100%;
border-collapse: collapse;
text-align:right;
}
.operations-table th,
.operations-table td {
border:1px solid #ccc;
padding:10px;
}
.operations-table thead th {
background-color:#a0c878;
color:white;
}

/* رسالة لا توجد بيانات */
.no-data {
text-align:center;
color:#999;
}

/* أزرار أسفل الجدول */
.bottom-buttons {
margin-top:20px; 
display:flex; 
gap:20px; 
flex-wrap: wrap; 
}
.summary-box {
flex-grow:1; 
max-width:300px; 
background:#f9f9f9; 
padding:15px; 
border-radius:8px; 
border:1px solid #ddd;
}
.summary-box h3 {
color:#a0c878; 
margin-bottom:10px; 
}
.summary-box ul {
list-style:none; 
padding-left:0; 
font-size:14px; 
}
.summary-box li.no-data {
color:#999; 
}

/* النوافذ المنبثقة */
.modal-overlay {
position: fixed;
top:0; left:0; right:0; bottom:0;
background-color: rgba(0,0,0,0.5);
z-index:99;

display:flex;
justify-content:center;
align-items:center;
}

.modal-content {
background:white;
padding:30px;
border-radius:15px;

width:90%;
max-width:500px;

text-align:center;

box-shadow:0 10px 25px rgba(0,0,0,0.2);
color:#393E46;

max-height:90vh;
overflow-y:auto;
}

.modal-content h2,
.modal-content h3 {
margin-bottom:15px;
color:#a0c878;
}

.modal-buttons,
.form-actions.center{
display:flex;
justify-content:center;
gap:15px;
margin-top:20px;
}

/* رسائل الحالة */
.status-popup {
position : fixed ;
bottom :20px ;
left :50% ;
transform : translateX(-50%) ;
padding :12px 25px ;
border-radius :8px ;
box-shadow : rgba(0,0,0,0.15) 0 2px 8px ;
min-width :300px ;
text-align:center ;
font-weight:bold ;
z-index :10000 ;
}
.status-popup.success {
background-color : #a0c878 ;
}
.status-popup.error {
background-color : #e74c3c ;
}

</style>
