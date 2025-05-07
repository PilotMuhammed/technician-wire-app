<template>
<div class="page-wrapper">
    <div class="login-card">
    <h4> أرشيف عمليات موظفين الصيانة </h4>
    <p class="description">يرجى تسجيل الدخول أو إنشاء حساب جديد لموظفي الصيانة.</p>

    <!-- تسجيل الدخول -->
    <div v-if="!showRegister">
        <div class="form-floating">
        <input v-model="loginUsername" type="text" placeholder=" " required />
        <label>اسم المستخدم</label>
        </div>

        <div class="form-floating">
        <input v-model="loginPassword" type="password" placeholder=" " required />
        <label>الرمز</label>
        </div>

        <button class="main-button" @click="login">دخول</button>

        <p class="switch">
        لا تملك حسابًا؟ <button class="link-button" @click="switchToRegister">إنشاء حساب جديد</button>
        </p>
    </div>

    <!-- إنشاء حساب جديد -->
    <div v-else>
        <div class="form-floating">
        <input v-model="registerFullName" type="text" placeholder=" " required />
        <label>الاسم الثلاثي</label>
        </div>

        <div class="form-floating">
        <input v-model="registerUsername" type="text" placeholder=" " required />
        <label>اسم المستخدم</label>
        </div>

        <div class="form-floating">
        <input v-model="registerPassword" type="password" placeholder=" " required />
        <label>الرمز</label>
        </div>

        <button class="main-button" @click="register">إرسال الطلب</button>

        <p class="switch">
        لديك حساب؟ <button class="link-button" @click="switchToLogin">العودة لتسجيل الدخول</button>
        </p>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="success">{{ successMessage }}</p>
    </div>

    <!-- نافذة منبثقة عند الخطأ -->
    <div v-if="showPopup" class="popup-overlay">
    <div class="popup-box">
        <p>{{ popupMessage }}</p>
        <button @click="closePopup">إغلاق</button>
    </div>
    </div>
</div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
import { supabase } from "../supabase/client"

const router = useRouter()

const showRegister = ref(false)
const loginUsername = ref('')
const loginPassword = ref('')
const registerFullName = ref('')
const registerUsername = ref('')
const registerPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const showPopup = ref(false)
const popupMessage = ref("")

const switchToRegister = () => {
    showRegister.value = true
    clearMessages()
}

const switchToLogin = () => {
    showRegister.value = false
    clearMessages()
}

const clearMessages = () => {
    errorMessage.value = ""
    successMessage.value = ""
    showPopup.value = false
}

const closePopup = () => {
    showPopup.value = false
}

function sanitizeInput(text) {
    return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

const login = async () => {
    clearMessages()

    if (
    loginUsername.value === ADMIN_USERNAME &&
    loginPassword.value === ADMIN_PASSWORD
    ) {
    localStorage.setItem("role", "admin")
    localStorage.setItem("username", ADMIN_USERNAME)
    router.push("/admin")
    return
    }

    const { data: technicians, error } = await supabase
    .from("technicians")
    .select("*")
    .eq("username", loginUsername.value)
    .eq("password", loginPassword.value)

    if (error) {
    errorMessage.value = "حدث خطأ أثناء التحقق."
    return
    }

    const found = technicians[0]

    if (found && found.approved) {
    localStorage.setItem("role", "technician")
    localStorage.setItem("username", found.username)
    router.push("/dashboard")
    return
    } else if (found && !found.approved) {
    errorMessage.value = "بانتظار موافقة المدير على الحساب."
    return
    }

    errorMessage.value = "اسم المستخدم أو الرمز غير صحيح."
}

const register = async () => {
    clearMessages()

    if (
    registerFullName.value.trim().length < 3 ||
    registerUsername.value.trim().length < 3 ||
    registerPassword.value.trim().length < 4
    ) {
    errorMessage.value = "يرجى تعبئة جميع الحقول بشكل صحيح."
    return
    }

    const { data: exists, error: checkError } = await supabase
    .from("technicians")
    .select("username")
    .eq("username", registerUsername.value)

    if (checkError) {
    errorMessage.value = "تعذر التحقق من اسم المستخدم."
    return
    }

    if (exists.length > 0) {
    popupMessage.value = "❌ اسم المستخدم مستخدم مسبقًا. يرجى اختيار اسم آخر."
    showPopup.value = true
    return
    }

    const { error: insertError } = await supabase.from("technicians").insert({
    full_name: sanitizeInput(registerFullName.value),
    username: sanitizeInput(registerUsername.value),
    password: sanitizeInput(registerPassword.value),
    approved: false
    })

    if (insertError) {
    console.error("Supabase insert error:", insertError)
    errorMessage.value = "فشل في إرسال الطلب. حاول مرة أخرى."
    return
    }

    successMessage.value = "✅ تم إرسال الطلب بنجاح. بانتظار موافقة المدير."
    registerFullName.value = ""
    registerUsername.value = ""
    registerPassword.value = ""
}
</script>

<style scoped>
/* نفس التنسيقات السابقة مع popup */
.page-wrapper {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg, #A0C878, #9FB3DF);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 30px;
}
.login-card {
    background: #fff;
    padding: 40px 30px;
    border-radius: 20px;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    color: #393E46;
    text-align: right;
    direction: rtl;
}
.form-floating {
    position: relative;
    margin-bottom: 20px;
}
.form-floating input {
    width: 100%;
    padding: 16px 12px 12px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 10px;
    background: transparent;
    outline: none;
    color: #393E46;
}
.form-floating label {
    position: absolute;
    top: 50%;
    right: 12px;
    transform: translateY(-50%);
    background-color: white;
    padding: 0 6px;
    font-size: 16px;
    color: #888;
    pointer-events: none;
    transition: all 0.2s ease-in-out;
}
.form-floating input:focus + label,
.form-floating input:not(:placeholder-shown) + label {
    top: -10px;
    font-size: 13px;
    color: #9FB3DF;
}
button.main-button {
    background-color: #A0C878;
    color: white;
    border: none;
    padding: 12px 25px;
    margin-top: 10px;
    cursor: pointer;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    transition: 0.3s;
    width: 100%;
}
button.main-button:hover {
    background-color: #8eb964;
}
button.link-button {
    background-color: transparent;
    color: #9FB3DF;
    border: none;
    cursor: pointer;
    font-weight: bold;
    font-size: 15px;
}
.error {
    color: red;
    margin-top: 10px;
}
.success {
    color: green;
    margin-top: 10px;
}
.popup-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
.popup-box {
    background: white;
    padding: 25px;
    border-radius: 15px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    color: #393E46;
    text-align: center;
    max-width: 300px;
}
.popup-box button {
    margin-top: 15px;
    background-color: #A0C878;
    border: none;
    padding: 8px 20px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    cursor: pointer;
}
</style>
