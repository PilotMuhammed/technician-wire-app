<template>
<div class="insert-operations-page" dir="rtl" style="padding: 20px; font-family: 'Tajawal', sans-serif; color: #333;">
<!-- حقل أجر موظف الصيانة -->
<div class="fee-input" style="margin-bottom: 20px;">
    <label for="technicianFee" style="font-weight: bold; color: #A0C878;">أجرة موظف الصيانة لكل عملية:</label>
    <input
    id="technicianFee"
    type="number"
    min="0"
    v-model.number="technicianFee"
    style="border: 1px solid #9FB3DF; border-radius: 5px; padding: 5px 10px; width: 150px;"
    />
</div>

<!-- زر إضافة عملية جديدة -->
<button
    @click="showAddModal = true"
    style="background-color: #A0C878; border: none; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-bottom: 30px;"
>
    إضافة عملية جديدة
</button>

<!-- نافذة إدخال العملية الجديدة -->
<div v-if="showAddModal" class="modal-overlay">
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitle" style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; margin: auto;">
    <h2 id="modalTitle" style="color: #A0C878; margin-bottom: 15px;">إدخال عملية صيانة جديدة</h2>

    <form @submit.prevent="addOperation">
        <div style="margin-bottom: 15px;">
        <label for="technician" style="font-weight: bold;">اختر موظف الصيانة:</label>
        <select id="technician" v-model="newOperation.technician_username" required
            style="width: 100%; padding: 6px; border-radius: 5px; border: 1px solid #9FB3DF;">
            <option value="" disabled>اختر الفني</option>
            <option v-for="tech in technicians" :key="tech.username" :value="tech.username">
            {{ tech.username }}
            </option>
        </select>
        </div>

        <div style="margin-bottom: 15px;">
        <label for="customerName" style="font-weight: bold;">اسم المشترك:</label>
        <input id="customerName" v-model.trim="newOperation.customer_name" type="text" required
            placeholder="أدخل اسم المشترك"
            style="width: 100%; padding: 6px; border-radius: 5px; border: 1px solid #9FB3DF;" />
        </div>

        <div style="margin-bottom: 15px;">
        <label for="paidAmount" style="font-weight: bold;">المبلغ المدفوع:</label>
        <input id="paidAmount" v-model.number="newOperation.paid_amount" type="number" min="0" required
            placeholder="أدخل المبلغ المدفوع"
            style="width: 100%; padding: 6px; border-radius: 5px; border: 1px solid #9FB3DF;" />
        </div>

        <div style="margin-bottom: 15px;">
        <label for="technicianFeeInput" style="font-weight: bold;">أجرة موظف الصيانة:</label>
        <input id="technicianFeeInput" :value="technicianFee" type="number" readonly
            style="width: 100%; padding: 6px; border-radius: 5px; border: 1px solid #9FB3DF; background-color:#f0f0f0;" />
        </div>

        <div style="margin-bottom: 15px;">
        <label for="notes" style="font-weight: bold;">ملاحظات (اختياري):</label>
        <textarea id="notes" v-model.trim="newOperation.notes"
            placeholder="أدخل ملاحظات إن وجدت"
            rows="3"
            style="width: 100%; padding: 6px; border-radius: 5px; border: 1px solid #9FB3DF;"></textarea>
        </div>

        <div style="margin-bottom: 15px;">
        <label for="timestamp" style="font-weight: bold;">تاريخ ووقت العملية:</label>
        <input id="timestamp" :value="currentTimestampFormatted" type="text" readonly
            style="width: 100%; padding: 6px; border-radius: 5px; border: 1px solid #9FB3DF; background-color:#f0f0f0;" />
        </div>

        <div style="text-align: center;">
        <button type="submit"
            style="background-color: #A0C878; color: white; padding: 10px 20px; border-radius:6px; border:none; cursor:pointer;">
            حفظ العملية
        </button>
        <button type="button" @click="closeAddModal"
            style="background-color:#ccc; margin-left:10px; padding:10px 20px; border-radius:6px; border:none; cursor:pointer;">
            إلغاء
        </button>
        </div>
    </form>
    </div>
</div>

<!-- جدول عرض العمليات -->
<div class="operations-table-container" style="overflow-x:auto;">
    <div style="margin-bottom:15px;">
    <label for="filterTechnician" style="font-weight:bold;">فلتر حسب موظف الصيانة:</label>
    <select id="filterTechnician" v-model="filterTechnician" style="padding:6px; border-radius:5px; border:1px solid #9FB3DF;">
        <option value="">الكل</option>
        <option v-for="tech in technicians" :key="'filter-'+tech.username" :value="tech.username">
        {{ tech.username }}
        </option>
    </select>
    </div>

    <table border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse: collapse; text-align:right;">
    <thead style="background-color:#A0C878; color:white;">
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
            <button @click="confirmDeleteSingle(op)" title="حذف العملية"
            style="background-color:#e74c3c;color:white;border:none;padding:6px 10px;border-radius:5px;cursor:pointer;">
            حذف
            </button>
        </td>
        </tr>
        <tr v-if="filteredOperations.length === 0">
        <td colspan="8" style="text-align:center; color:#999;">لا توجد عمليات لعرضها</td>
        </tr>
    </tbody>
    </table>
</div>

<!-- أزرار أسفل الجدول -->
<div class="bottom-buttons" style="margin-top:20px; display:flex; gap:20px; flex-wrap: wrap;">
    <!-- زر حذف العمليات لموظف معين -->
    <div>
    <button @click="showDeleteAllModal = true"
        style="background-color:#e67e22;color:white;padding:10px 20px;border:none;border-radius:6px;cursor:pointer;">
        حذف جميع عمليات موظف
    </button>
    </div>

    <!-- ملخص المبالغ المدفوعة لكل موظف -->
    <div style="flex-grow:1; max-width:300px; background:#f9f9f9;padding:15px;border-radius:8px;border:1px solid #ddd;">
    <h3 style="color:#A0C878;margin-bottom:10px;">مجموع المبالغ المدفوعة لكل موظف</h3>
    <ul style="list-style:none;padding-left:0;font-size:14px;">
        <li v-for="[tech, data] in Object.entries(paymentSummary)" :key="'paid-'+tech">
        {{ tech }} : {{ data.totalPaid.toFixed(2) }}
        </li>
        <li v-if="Object.keys(paymentSummary).length === 0" style="color:#999;">لا توجد بيانات</li>
    </ul>
    </div>

    <!-- ملخص أجور الفنيين لكل موظف -->
    <div style="flex-grow:1; max-width:300px; background:#f9f9f9;padding:15px;border-radius:8px;border:1px solid #ddd;">
    <h3 style="color:#A0C878;margin-bottom:10px;">مجموع أجور الفنيين لكل موظف</h3>
    <ul style="list-style:none;padding-left:0;font-size:14px;">
        <li v-for="[tech, data] in Object.entries(paymentSummary)" :key="'fee-'+tech">
        {{ tech }} : {{ data.totalFee.toFixed(2) }}
        </li>
        <li v-if="Object.keys(paymentSummary).length === 0" style="color:#999;">لا توجد بيانات</li>
    </ul>
    </div>
</div>

<!-- نافذة تأكيد حذف عملية واحدة -->
<div v-if="showConfirmDeleteSingleModal" class="modal-overlay">
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="confirmDeleteTitle"
    style="background:white;padding:20px;border-radius:8px;max-width:400px;margin:auto;">
    <h3 id="confirmDeleteTitle" style="color:#e74c3c;margin-bottom:15px;">تأكيد حذف العملية</h3>
    <p>هل أنت متأكد من حذف هذه العملية؟</p>

    <div style="margin-top:20px;text-align:center;">
        <button @click="deleteSingleOperation"
        style="background-color:#e74c3c;color:white;padding:10px 20px;border:none;border-radius:6px;cursor:pointer;">
        حذف
        </button>
        <button @click="showConfirmDeleteSingleModal = false"
        style="background-color:#ccc;margin-left:10px;padding:10px 20px;border:none;border-radius:6px;cursor:pointer;">
        إلغاء
        </button>
    </div>
    </div>
</div>

<!-- نافذة حذف جميع عمليات موظف -->
<div v-if="showDeleteAllModal" class="modal-overlay">
    <div class="modal-content" role="dialog" aria-modal=true aria-labelledby="deleteAllTitle"
    style="background:white;padding:20px;border-radius:8px;max-width:400px;margin:auto;">
    <h3 id='deleteAllTitle' style='color:#e67e22;margin-bottom:15px;'>حذف جميع عمليات موظف</h3>

    <label for='deleteTechnician' style='font-weight:bold;'>اختر موظف الحذف:</label><br />
    <select id='deleteTechnician' v-model='deleteTechnicianUsername' required
        style='width:100%;padding:6px;margin-top:8px;border-radius:5px;border:1px solid #9FB3DF;margin-bottom:15px'>
        <option value="" disabled>اختر الموظف</option>
        <option v-for='tech in technicians' :key="'del-'+tech.username' :value='tech.username'>{{ tech.username }}</option>
    </select>

    <p>هل أنت متأكد من حذف جميع العمليات لهذا الموظف؟ هذا الإجراء لا يمكن التراجع عنه.</p>

    <div style='text-align:center;margin-top:20px'>
        <button @click='deleteAllOperationsForTechnician'
        style='background-color:#e67e22;color:white;padding:10px 20px;border:none;border-radius:6px;cursor:pointer;'>حذف</button>
        <button @click='() => { showDeleteAllModal = false ; deleteTechnicianUsername="" }'
        style='background-color:#ccc;margin-left:10px;padding:10px 20px;border:none;border-radius:6px;cursor:pointer;'>إلغاء</button>
    </div>

    </div>
</div>

<!-- رسائل الحالة -->
<div v-if='statusMessage.visible' class='status-popup' :class="{ success : statusMessage.type==='success', error : statusMessage.type==='error' }"
    role='alert' aria-live='assertive'
    style='position : fixed ; bottom :20px ; left :50% ; transform : translateX(-50%) ; background : #A0C878 ; color : white ; padding :12px 25px ; border-radius :8px ; box-shadow : rgba(0,0,0,0.15) 0 2px 8px ; min-width :300px ; text-align:center ; z-index :10000 ; font-weight:bold ;'>
    {{ statusMessage.text }}
</div>

</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { createClient } from '@supabase/supabase-js'

// إعدادات Supabase (غيّرها حسب مشروعك)
const supabaseUrl = 'https://YOUR_SUPABASE_URL.supabase.co'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

// حالة الصفحة
const technicianFee = ref(5) // القيمة الافتراضية لأجرة الفني

const technicians = ref([]) // قائمة الفنيين الموافق عليهم
const operations = ref([])   // قائمة العمليات

const filterTechnician = ref('') // فلتر الموظف في الجدول

// نافذة إدخال العملية الجديدة
const showAddModal = ref(false)

// نموذج الإدخال الجديد
const newOperation = ref({
technician_username:'',
customer_name:'',
paid_amount:null,
technician_fee:null,
notes:'',
})

// الوقت الحالي للعرض في النموذج (في صيغة قابلة للقراءة)
const currentTimestampFormatted = new Date().toLocaleString('ar-EG', {
year:'numeric', month:'2-digit', day:'2-digit',
hour:'2-digit', minute:'2-digit', second:'2-digit',
})

// حالة تأكيد الحذف لعملية واحدة
const showConfirmDeleteSingleModal = ref(false)
const operationToDelete = ref(null)

// حالة حذف جميع عمليات موظف
const showDeleteAllModal = ref(false)
const deleteTechnicianUsername = ref('')

// حالة رسائل النجاح والخطأ
const statusMessage = ref({ visible:false, text:'', type:'success' })

// جلب بيانات الفنيين الموافق عليهم فقط من جدول technicians
async function fetchTechnicians() {
const { data, error } = await supabase
.from('technicians')
.select('username')
.eq('approved', true)
.order('username', { ascending:true })

if (error) {
showStatus('خطأ في جلب بيانات الفنيين.', 'error')
return
}

technicians.value = data || []
}

// جلب العمليات من جدول operations مع فلترة حسب الموظف (إذا محدد)
async function fetchOperations() {
let query = supabase.from('operations').select('*').order('timestamp', { ascending:false })

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

// عرض رسالة حالة (نجاح أو خطأ)
function showStatus(text, type = 'success', duration = 4000) {
statusMessage.value = { visible:true, text, type }

setTimeout(() => {
statusMessage.value.visible = false
statusMessage.value.text = ''
statusMessage.value.type = 'success'
}, duration)
}

// تنسيق التاريخ والوقت من timestamp (ISO string)
function formatTimestamp(ts) {
if (!ts) return '-'

const d = new Date(ts)

return d.toLocaleString('ar-EG', {
year:'numeric', month:'2-digit', day:'2-digit',
hour:'2-digit', minute:'2-digit', second:'2-digit',
})
}

// إضافة عملية جديدة إلى قاعدة البيانات
async function addOperation() {

if (!newOperation.value.technician_username || !newOperation.value.customer_name.trim() || newOperation.value.paid_amount === null) {
showStatus('يرجى تعبئة جميع الحقول المطلوبة.', 'error')
return
}

// تعيين أجرة الفني من الحقل العلوي قبل الإرسال
newOperation.value.technician_fee = technicianFee.value

// إرسال البيانات إلى Supabase (timestamp يتم تعيينه تلقائيًا في DB)

const { error } = await supabase.from('operations').insert([
{
    technician_username:newOperation.value.technician_username,
    customer_name:newOperation.value.customer_name.trim(),
    paid_amount:newOperation.value.paid_amount,
    technician_fee:newOperation.value.technician_fee,
    notes:newOperation.value.notes.trim() || null,
    // لا نرسل timestamp لكي يملأها DB تلقائيًا (افتراضياً الآن())
}
])

if (error) {
showStatus('حدث خطأ أثناء حفظ العملية.', 'error')
return
}

showStatus('تمت إضافة العملية بنجاح.', 'success')

closeAddModal()

await fetchOperations()
}

// إغلاق نافذة الإدخال ومسح النموذج
function closeAddModal() {
showAddModal.value = false

newOperation.value = {
technician_username:'',
customer_name:'',
paid_amount:null,
technician_fee:null,
notes:'',
}
}

// فتح نافذة تأكيد حذف عملية واحدة مع تعيين العملية للحذف
function confirmDeleteSingle(op) {
operationToDelete.value = op
showConfirmDeleteSingleModal.value = true
}

// حذف عملية واحدة من قاعدة البيانات
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

// حذف جميع عمليات موظف معين
async function deleteAllOperationsForTechnician() {

if (!deleteTechnicianUsername.value) {
showStatus('يرجى اختيار موظف للحذف.', 'error')
return
}

const { error } = await supabase.from('operations').delete().eq('technician_username', deleteTechnicianUsername.value)


if(error){
showStatus('حدث خطأ أثناء حذف العمليات.', 'error')
return
}

showStatus(`تم حذف جميع عمليات ${deleteTechnicianUsername.value} بنجاح.`, 'success')

showDeleteAllModal.value = false

deleteTechnicianUsername.value = ''

await fetchOperations()
}

// حساب ملخص المبالغ المدفوعة وأجور الفنيين لكل موظف (حسب العمليات المعروضة)
const paymentSummary = computed(() => {

const summary = {}

operations.value.forEach(op => {

const tech = op.technician_username || 'غير محدد'

if (!summary[tech]) summary[tech] = { totalPaid :0 , totalFee :0 }

summary[tech].totalPaid += Number(op.paid_amount || 0)

summary[tech].totalFee += Number(op.technician_fee || 0)

})

return summary

})

// العمليات بعد تطبيق الفلتر على الموظف المختار
const filteredOperations = computed(() => {

return filterTechnician.value

? operations.value.filter(op => op.technician_username === filterTechnician.value)

: operations.value

})

// عند تحميل الصفحة، جلب بيانات الفنيين والعمليات تلقائيًا

onMounted(async () => {

await fetchTechnicians()

await fetchOperations()

})

</script>

<style scoped>

/* خلفية شفافة للنوافذ المنبثقة */
.modal-overlay {

position : fixed ;

top :0 ;

left :0 ;

width :100vw ;

height :100vh ;

background-color : rgba(0,0,0,0.4) ;

display : flex ;

justify-content : center ;

align-items : center ;

z-index :10000 ;

}

/* تصميم محتوى النوافذ */
.modal-content {

max-height :90vh ;

overflow-y : auto ;

}

/* تأثير عند تمرير الجدول أفقياً */
.operations-table-container::-webkit-scrollbar {

height :8px ;

}

.operations-table-container::-webkit-scrollbar-thumb {

background-color : #A0C878 ;

border-radius :4px ;

}

/* رسائل الحالة */
.status-popup.success {

background-color : #A0C878 ;

}

.status-popup.error {

background-color : #e74c3c ;

}

</style>
