<template>
<div class="page-wrapper">
<div class="technician-card">
    <h3>لوحة موظف الصيانة</h3>
    <p style="font-size: 18px; margin-top: -10px;">مرحبًا بك {{ fullName }}</p>

    <!-- نموذج السحب -->
    <div class="form-section">
    <div class="form-group">
        <label for="wire">نوع الواير:</label>
        <select v-model="selectedWire" id="wire" class="input-clean">
        <option disabled value="">اختر نوع الواير</option>
        <option>BlueStorm 20m</option>
        <option>BlueStorm 30m</option>
        </select>
    </div>

    <div class="form-group">
        <label for="quantity">الكمية:</label>
        <select v-model="selectedQuantity" id="quantity" class="input-clean">
        <option disabled value="">اختر الكمية</option>
        <option v-for="n in 3" :key="n">{{ n }}</option>
        </select>
    </div>

    <div class="form-group">
        <label for="notes">ملاحظات (اختياري):</label>
        <input v-model="notes" id="notes" type="text" placeholder="اكتب ملاحظتك هنا إن وجدت" class="input-clean" />
    </div>

    <div class="timestamp-box">
        <p>{{ formattedDate }} - {{ formattedTime }}</p>
    </div>

    <button class="main-button" @click="submitOperation">إرسال</button>
    </div>

    <!-- ملخص الوايرات حسب النوع -->
    <div class="technician-wire-summary">
    <h3 style="color:#a0c878;">ملخص الوايرات حسب النوع</h3>
    <div class="wire-summary-flex">
        <!-- بلوك 20m -->
        <div class="wire-summary-block">
        <div><b>نوع الواير:</b> BlueStorm 20m</div>
        <div>
            <span>المسحوب:</span>
            <b>{{ wireTotals['BlueStorm 20m'] || 0 }}</b>
        </div>
        <div>
            <span class="used-label">المستخدم:</span>
            <span class="used-value">{{ usedByType['20m'] }}</span>
        </div>
        <div>
            <span class="remaining-label">المتبقي:</span>
            <span
            :class="['remaining-value', remainingByType['20m'] <= 0 ? 'low' : '']"
            >{{ remainingByType['20m'] }}</span>
        </div>
        </div>
        <!-- بلوك 30m -->
        <div class="wire-summary-block">
        <div><b>نوع الواير:</b> BlueStorm 30m</div>
        <div>
            <span>المسحوب:</span>
            <b>{{ wireTotals['BlueStorm 30m'] || 0 }}</b>
        </div>
        <div>
            <span class="used-label">المستخدم:</span>
            <span class="used-value">{{ usedByType['30m'] }}</span>
        </div>
        <div>
            <span class="remaining-label">المتبقي:</span>
            <span
            :class="['remaining-value', remainingByType['30m'] <= 0 ? 'low' : '']"
            >{{ remainingByType['30m'] }}</span>
        </div>
        </div>
    </div>
    </div>

    <hr class="divider" />

    <!-- سجل العمليات -->
    <div class="operations-section">
    <h2>سجل العمليات هذا الأسبوع</h2>
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
        <tr v-for="(op, i) in operations" :key="i">
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
</div>
</template>




<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase/client'

// اسم المستخدم الحالي من التخزين المحلي
const username = ref(localStorage.getItem("username") || "")

// الاسم الكامل للموظف
const fullName = ref("")

// جلب الاسم الكامل من قاعدة البيانات
const fetchFullName = async () => {
const { data, error } = await supabase
.from("technicians")
.select("full_name")
.eq("username", username.value)
.single()

if (!error && data) {
fullName.value = data.full_name
}
}

// العمليات (سحب من المخزن)
const selectedWire = ref('')
const selectedQuantity = ref('')
const notes = ref('')
const operations = ref([]) // جدول عمليات السحب من المخزن

// الوقت والتاريخ الحالي
const now = ref(new Date())
const formattedDate = computed(() => now.value.toLocaleDateString("ar-IQ"))
const formattedTime = computed(() => now.value.toLocaleTimeString("ar-IQ"))

// جلب العمليات الخاصة بالفني (سحب من المخزن)
const fetchOperations = async () => {
const { data, error } = await supabase
.from("operations")
.select("*")
.eq("technician_username", username.value)
.order("timestamp", { ascending: false })

if (!error) operations.value = data || []
}

// العمليات المستخدمة فعليًا (تم استخدام الواير فعليًا مع العميل)
const usedWireOperations = ref([]) // جدول customer_operations

const fetchUsedWireOperations = async () => {
const { data, error } = await supabase
.from("customer_operations")
.select("*")
.eq("technician_username", username.value)
.or("used_wire.eq.true,used_wire.eq.yes")
if (!error) usedWireOperations.value = data || []
}

// عند تحميل الصفحة
onMounted(() => {
fetchFullName()
fetchOperations()
fetchUsedWireOperations()
setInterval(() => now.value = new Date(), 1000)
})

// إرسال عملية جديدة
const submitOperation = async () => {
if (!selectedWire.value || !selectedQuantity.value) return

const { error } = await supabase.from("operations").insert({
technician_username: username.value,
wire: selectedWire.value,
quantity: parseInt(selectedQuantity.value),
notes: notes.value,
timestamp: new Date().toISOString()
})

if (!error) {
selectedWire.value = ''
selectedQuantity.value = ''
notes.value = ''
now.value = new Date()
fetchOperations()
// إعادة تحديث ملخص المستخدم بعد الإرسال
fetchUsedWireOperations()
}
}

// تنسيقات التاريخ والوقت
const formatDate = iso => new Date(iso).toLocaleDateString("ar-IQ")
const formatTime = iso => new Date(iso).toLocaleTimeString("ar-IQ")

// أنواع الوايرات الأساسية (حسب جداولك)
const WIRE_TYPES = ['BlueStorm 20m', 'BlueStorm 30m']

// حساب مجموع السحب حسب النوع (المسحوب)
const wireTotals = computed(() => {
const totals = {}
operations.value.forEach(op => {
const wireType = op.wire || op.wire_type
if (WIRE_TYPES.includes(wireType)) {
    if (!totals[wireType]) totals[wireType] = 0
    totals[wireType] += Number(op.quantity) || 0
}
})
return totals
})

// حساب المستخدم فعليًا من customer_operations
const usedByType = computed(() => {
const res = { '20m': 0, '30m': 0 }
usedWireOperations.value.forEach(op => {
// اسم النوع يجب أن يكون مطابق، حسب جداولك غالبًا: op.wire_type = '20m' أو '30m'
if (op.wire_type === '20m') res['20m'] += 1
if (op.wire_type === '30m') res['30m'] += 1
})
return res
})

// المتبقي = المسحوب - المستخدم لكل نوع
const remainingByType = computed(() => {
return {
'20m': (wireTotals.value['BlueStorm 20m'] || 0) - (usedByType.value['20m'] || 0),
'30m': (wireTotals.value['BlueStorm 30m'] || 0) - (usedByType.value['30m'] || 0),
}
})
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

.technician-card {
background: #fff;
border-radius: 20px;
max-width: 800px;
width: 100%;
padding: 30px;
box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
color: #393E46;
direction: rtl;
text-align: right;
}

.form-section .form-group {
width: 100%;
display: flex;
flex-direction: column;
margin-bottom: 20px;
}

.form-group label {
display: block;
margin-bottom: 6px;
font-weight: bold;
}

.input-clean {
width: 100%;
max-width: 100%;
padding: 12px;
font-size: 16px;
border: 1px solid #ccc;
border-radius: 8px;
outline: none;
background: transparent;
color: #393E46;
box-sizing: border-box;
}

select.input-clean {
width: 100%;
max-width: 100%;
}

.timestamp-box {
background: #eef3e5;
padding: 14px;
border-radius: 14px;
margin: 20px 0;
font-weight: bold;
text-align: center;
font-size: 18px;
box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.05);
}

.main-button {
background-color: #A0C878;
color: white;
border: none;
padding: 12px 25px;
cursor: pointer;
border-radius: 8px;
font-size: 16px;
font-weight: bold;
transition: 0.3s;
width: 100%;
}

.main-button:hover {
background-color: #8eb964;
}

.divider {
margin: 30px 0;
border: none;
border-top: 1px solid #ccc;
}

.operations-section table {
width: 100%;
border-collapse: collapse;
}

.operations-section th,
.operations-section td {
border: 1px solid #ccc;
padding: 10px;
text-align: center;
}

/* =============== ملخص الوايرات لكل نوع =============== */
.technician-wire-summary {
margin: 18px 0 10px 0;
padding-bottom: 10px;
background: #f9f9fa;
border-radius: 14px;
border: 1.5px solid #a0c87855;
box-shadow: 0 2px 6px #a0c87818;
}

.wire-summary-flex {
display: flex;
gap: 24px;
margin-bottom: 6px;
flex-wrap: wrap;
justify-content: start;
}

.wire-summary-block {
min-width: 190px;
background: #f4f9f1;
border-radius: 12px;
padding: 13px 18px 10px 18px;
border: 1.5px solid #a0c87833;
font-size: 16px;
box-shadow: 0 1px 4px #b6cfda1c;
margin-bottom: 10px;
display: flex;
flex-direction: column;
gap: 6px;
}

.wire-summary-block div {
margin-bottom: 2px;
}

.wire-summary-block b {
color: #5373c7;
font-weight: bold;
letter-spacing: 0.5px;
font-size: 17px;
}

.wire-summary-block .used-label,
.wire-summary-block .used-value {
color: #30b75b !important;  /* المستخدم أخضر */
font-weight: bold;
}
.wire-summary-block .remaining-label,
.wire-summary-block .remaining-value {
color: #e67e22 !important;  /* المتبقي برتقالي */
font-weight: bold;
}

.wire-summary-block .remaining-value.low {
color: #e74c3c !important;  /* المتبقي أحمر إذا صفر أو أقل */
}

/* responsive */
@media (max-width: 600px) {
.wire-summary-flex {
    flex-direction: column;
    gap: 10px;
}
.technician-card {
    padding: 20px 10px;
}
.main-button {
    font-size: 15px;
    padding: 10px;
}
}

@media screen and (max-width: 480px) {
.technician-card {
    padding: 20px 6px;
}
.form-group {
    margin-bottom: 16px;
}
}

</style>
