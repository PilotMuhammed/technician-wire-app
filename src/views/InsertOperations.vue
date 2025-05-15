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

    <!-- المجموعات بتنسيق التصميم المطلوب -->
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
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../supabase';

const technicianFee = ref(0);
const showAddModal = ref(false);
const newOperation = ref({
technician_username: '',
customer_name: '',
paid_amount: null,
technician_fee: null,
notes: '',
});
const currentTimestampFormatted = new Date().toLocaleString('ar-EG');
const filterTechnician = ref('all');
const operations = ref([]);
const technicians = ref([]);

const getTechnicianFullName = (username) => {
const tech = technicians.value.find(t => t.username === username);
return tech ? tech.full_name : username;
};

const formatDate = (dateString) => {
const date = new Date(dateString);
return date.toLocaleString('ar-EG');
};

const filteredOperations = computed(() => {
if (filterTechnician.value === 'all') return operations.value;
return operations.value.filter(op => op.technician_username === filterTechnician.value);
});

const totalPayments = computed(() => {
return filteredOperations.value.reduce((sum, op) => sum + (op.paid_amount || 0), 0);
});

const totalFees = computed(() => {
return filteredOperations.value.reduce((sum, op) => sum + (op.technician_fee || 0), 0);
});

const fetchOperations = async () => {
const { data, error } = await supabase.from('customer_operations').select('*');
if (!error) operations.value = data;
};

const fetchTechnicians = async () => {
const { data, error } = await supabase.from('technicians').select('*').eq('approved', true);
if (!error) technicians.value = data;
};

const addOperation = async () => {
newOperation.value.technician_fee = technicianFee.value;
const { error } = await supabase.from('customer_operations').insert([
{
    ...newOperation.value,
    timestamp: new Date().toISOString(),
},
]);
if (!error) {
showAddModal.value = false;
fetchOperations();
newOperation.value = {
    technician_username: '',
    customer_name: '',
    paid_amount: null,
    technician_fee: null,
    notes: '',
};
}
};

const deleteOperation = async (id) => {
const { error } = await supabase.from('customer_operations').delete().eq('id', id);
if (!error) fetchOperations();
};

const deleteAllOperations = async () => {
if (filterTechnician.value === 'all') return;
const { error } = await supabase.from('customer_operations').delete().eq('technician_username', filterTechnician.value);
if (!error) fetchOperations();
};

onMounted(() => {
fetchOperations();
fetchTechnicians();
});
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
