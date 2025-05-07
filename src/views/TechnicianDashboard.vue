<template>
<div class="page-wrapper">
    <div class="admin-card">
    <h1>لوحة موظف الصيانة</h1>

    <div class="form-group">
        <label>نوع الواير</label>
        <select v-model="selectedWire">
        <option value="">-- اختر نوع الواير --</option>
        <option value="BlueStorm 20m">BlueStorm 20m</option>
        <option value="BlueStorm 30m">BlueStorm 30m</option>
        </select>
    </div>

    <div class="form-group">
        <label>الكمية</label>
        <select v-model="selectedQuantity">
        <option value="">-- اختر الكمية --</option>
        <option v-for="n in 3" :key="n" :value="n">{{ n }}</option>
        </select>
    </div>

    <div class="timestamp-box">
        <p>{{ formattedDate }} - {{ formattedTime }}</p>
    </div>

    <button class="main-button" @click="submitOperation">إرسال</button>

    <hr class="divider" />

    <div v-for="(group, date) in groupedOperations" :key="date" class="operation-day">
        <h3>{{ date }}</h3>
        <table class="operations-table">
        <thead>
            <tr>
            <th>الوقت</th>
            <th>نوع الواير</th>
            <th>الكمية</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(op, i) in group" :key="i">
            <td>{{ formatTime(op.timestamp) }}</td>
            <td>{{ op.wire }}</td>
            <td>{{ op.quantity }}</td>
            </tr>
        </tbody>
        </table>
    </div>
    </div>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase/client'

const selectedWire = ref('')
const selectedQuantity = ref('')
const operations = ref([])
const formattedDate = ref('')
const formattedTime = ref('')

const username = localStorage.getItem("username") || ""

const updateTime = () => {
const now = new Date()
formattedDate.value = now.toLocaleDateString('ar-IQ')
formattedTime.value = now.toLocaleTimeString('ar-IQ')
}

onMounted(() => {
updateTime()
setInterval(updateTime, 1000)
fetchOperations()
})

const fetchOperations = async () => {
const { data, error } = await supabase
    .from("operations")
    .select("*")
    .eq("technician_username", username)
    .order("timestamp", { ascending: false })
if (!error) operations.value = data
}

const submitOperation = async () => {
if (!selectedWire.value || !selectedQuantity.value) return
const { error } = await supabase.from("operations").insert({
    wire: selectedWire.value,
    quantity: selectedQuantity.value,
    technician_username: username,
    timestamp: new Date().toISOString()
})
if (!error) {
    selectedWire.value = ''
    selectedQuantity.value = ''
    fetchOperations()
}
}

const formatTime = (iso) => new Date(iso).toLocaleTimeString('ar-IQ')

const groupedOperations = computed(() => {
const groups = {}
for (const op of operations.value) {
    const date = new Date(op.timestamp).toLocaleDateString('ar-IQ')
    if (!groups[date]) groups[date] = []
    groups[date].push(op)
}
return groups
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
.admin-card {
background: #fff;
border-radius: 20px;
width: 100%;
max-width: 800px;
padding: 30px;
box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
color: #393E46;
direction: rtl;
text-align: right;
}
.form-group {
margin-bottom: 20px;
}
select {
width: 100%;
padding: 10px;
font-size: 16px;
border-radius: 8px;
border: 1px solid #ccc;
}
.timestamp-box {
background: #f0f0f0;
padding: 12px;
border-radius: 10px;
margin-bottom: 15px;
font-size: 18px;
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
width: 100%;
font-weight: bold;
}
.divider {
margin: 30px 0 20px;
border-top: 2px solid #ccc;
}
.operations-table {
width: 100%;
border-collapse: collapse;
margin-bottom: 30px;
}
.operations-table th,
.operations-table td {
border: 1px solid #ccc;
padding: 10px;
text-align: center;
}
.operation-day h3 {
margin-bottom: 10px;
color: #393E46;
}
</style>
