<template>
<div class="page-wrapper">
    <div class="technician-card">
    <h1>واجهة موظف الصيانة</h1>

    <div class="form-section">
        <div class="form-group">
        <label for="wire">نوع الواير:</label>
        <select v-model="selectedWire" id="wire">
            <option disabled value="">اختر نوع الواير</option>
            <option>BlueStorm 20m</option>
            <option>BlueStorm 30m</option>
        </select>
        </div>

        <div class="form-group">
        <label for="quantity">الكمية:</label>
        <select v-model="selectedQuantity" id="quantity">
            <option disabled value="">اختر الكمية</option>
            <option v-for="n in 3" :key="n">{{ n }}</option>
        </select>
        </div>

        <div class="form-group">
        <label for="notes">ملاحظات (اختياري):</label>
        <input v-model="notes" id="notes" type="text" placeholder="اكتب ملاحظتك هنا إن وجدت" />
        </div>

        <div class="timestamp-box">
        <p>{{ formattedDate }} - {{ formattedTime }}</p>
        </div>

        <button class="main-button" @click="submitOperation">إرسال</button>
    </div>

    <hr class="divider" />

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
import { useRouter } from 'vue-router'
import { supabase } from '../supabase/client'

const router = useRouter()
const selectedWire = ref('')
const selectedQuantity = ref('')
const notes = ref('')
const operations = ref([])
const username = ref(localStorage.getItem("username") || "")

const now = ref(new Date())
const formattedDate = computed(() => now.value.toLocaleDateString("ar-IQ"))
const formattedTime = computed(() => now.value.toLocaleTimeString("ar-IQ"))

const fetchOperations = async () => {
    const { data, error } = await supabase
    .from("operations")
    .select("*")
    .eq("technician_username", username.value)
    .order("timestamp", { ascending: false })

    if (!error) operations.value = data
}

onMounted(() => {
    fetchOperations()
    setInterval(() => now.value = new Date(), 1000)
})

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
    }
}

const formatDate = iso => new Date(iso).toLocaleDateString("ar-IQ")
const formatTime = iso => new Date(iso).toLocaleTimeString("ar-IQ")
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
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: bold;
}

.form-group select,
.form-group input {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 8px;
    outline: none;
}

.timestamp-box {
    background: #eef3e5;
    padding: 12px;
    border-radius: 10px;
    margin: 15px 0;
    font-weight: bold;
    text-align: center;
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
</style>
