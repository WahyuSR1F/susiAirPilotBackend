# 🔌 Panduan Cara Menghubungkan Frontend ke API Backend (Susi Air Pilot App)

Panduan ini ditujukan bagi pengembang frontend (khususnya **Nuxt 3**, **Vue 3**, **React**, atau **Mobile App**) untuk mengintegrasikan antarmuka pengguna dengan REST API Susi Air Backend yang diamankan menggunakan standar **OAuth 2.0 Bearer Token**.

---

## 📋 Ringkasan Alur Autentikasi (OAuth 2.0 Flow)

```
[ Frontend: Sign-in Page ]
       │
       │ 1. POST /auth/login { username, password }
       ▼
[ Backend NestJS API ]
       │
       │ 2. Validasi kredensial (crypto.timingSafeEqual)
       │ 3. Return { accessToken, tokenType: "Bearer", expiresIn }
       ▼
[ Frontend: Pinia / Storage ]
       │
       │ Simpan token di localStorage / Cookie / Pinia Store
       │
       ▼
[ Setiap Request API Berikutnya ]
       │
       │ Header: "Authorization: Bearer <accessToken>"
       ▼
[ Backend: AuthGuard ]
       │
       ├─ Valid token ──> Berikan Data (200 OK)
       └─ Invalid/Expired ──> Error 401 Unauthorized (Redirect ke Login)
```

---

## 🛠️ 1. Konfigurasi Environment di Frontend

Di project frontend Anda (misalnya Nuxt 3 di file `.env` atau `nuxt.config.ts`):

```ini
# .env pada Nuxt 3
NUXT_PUBLIC_API_BASE=http://localhost:3000
```

---

## 🍍 2. Implementasi State Management: Pinia Auth Store (Nuxt 3)

Buat file store di `stores/auth.ts`:

```typescript
// stores/auth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface PilotProfile {
  name: string;
  totalFlightHours: number;
  avatarUrl: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const pilot = ref<PilotProfile | null>(null);

  // Inisialisasi token dari localStorage / Cookie saat di client-side
  if (process.client) {
    token.value = localStorage.getItem('susi_air_token');
  }

  const isAuthenticated = computed(() => !!token.value);

  // 1. Aksi Login
  async function login(credentials: { username: string; password: string }) {
    const config = useRuntimeConfig();
    try {
      const response = await $fetch<{ accessToken: string; tokenType: string }>(
        `${config.public.apiBase}/auth/login`,
        {
          method: 'POST',
          body: credentials,
        }
      );

      token.value = response.accessToken;
      if (process.client) {
        localStorage.setItem('susi_air_token', response.accessToken);
      }

      // Ambil data profil setelah login
      await fetchProfile();
      return { success: true };
    } catch (err: any) {
      // Normalisasi pesan error dari backend
      const message =
        err?.data?.message ??
        (Array.isArray(err?.data?.message)
          ? err?.data?.message.join(', ')
          : 'Gagal masuk. Periksa kembali username dan password Anda.');
      return { success: false, error: message };
    }
  }

  // 2. Mengambil Profil Pilot
  async function fetchProfile() {
    if (!token.value) return;
    const config = useRuntimeConfig();

    try {
      const data = await $fetch<PilotProfile>(`${config.public.apiBase}/pilot/me`, {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      });
      pilot.value = data;
    } catch (err: any) {
      if (err?.status === 401) {
        logout();
      }
    }
  }

  // 3. Aksi Logout
  function logout() {
    token.value = null;
    pilot.value = null;
    if (process.client) {
      localStorage.removeItem('susi_air_token');
    }
    navigateTo('/login');
  }

  return {
    token,
    pilot,
    isAuthenticated,
    login,
    fetchProfile,
    logout,
  };
});
```

---

## ⚡ 3. HTTP Client Terpusat (Composable `useApiFetch` di Nuxt 3)

Agar tidak perlu mengetikkan `headers: { Authorization: ... }` secara manual di setiap komponen, buat composable `composables/useApiFetch.ts`:

```typescript
// composables/useApiFetch.ts
export function useApiFetch<T>(endpoint: string, options: any = {}) {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const defaults = {
    baseURL: config.public.apiBase,
    headers: authStore.token
      ? { Authorization: `Bearer ${authStore.token}` }
      : {},
    onResponseError({ response }: any) {
      // Jika token expired atau invalid (401), otomatis redirect ke login
      if (response.status === 401) {
        authStore.logout();
      }
    },
  };

  const mergedOptions = {
    ...defaults,
    ...options,
    headers: {
      ...defaults.headers,
      ...options.headers,
    },
  };

  return useFetch<T>(endpoint, mergedOptions);
}
```

---

## 💻 4. Contoh Pemanggilan di Komponen / Halaman

### 4.1. Halaman Sign In (`pages/login.vue`)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const username = ref('johndoe');
const password = ref('susiairtest');
const errorMessage = ref('');
const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  errorMessage.value = '';

  const res = await authStore.login({
    username: username.value,
    password: password.value,
  });

  loading.value = false;
  if (res.success) {
    navigateTo('/');
  } else {
    errorMessage.value = res.error;
  }
}
</script>

<template>
  <div class="login-container">
    <h2>Susi Air Pilot Sign In</h2>
    <form @submit.prevent="handleLogin">
      <div>
        <label>Username</label>
        <input v-model="username" type="text" required />
      </div>
      <div>
        <label>Password</label>
        <input v-model="password" type="password" required />
      </div>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      <button :disabled="loading" type="submit">
        {{ loading ? 'Masuk...' : 'Sign In' }}
      </button>
    </form>
  </div>
</template>
```

---

### 4.2. Halaman Home: Ringkasan Jam Terbang & Trend Chart

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';

// Pilihan rentang rolling sum: 1w, 1m, 3m, 6m, 1y
const selectedRange = ref<'1w' | '1m' | '3m' | '6m' | '1y'>('1w');

// Panggil endpoint /flight-hours/summary dengan reactive query parameter
const { data: summary, refresh, pending } = await useApiFetch('/flight-hours/summary', {
  query: { range: selectedRange },
});

// data.cards memuat 4 kartu: Daily, Weekly, Monthly, Annual
// data.series memuat 15 titik chart (hari ini tepat di indeks ke-7)
</script>

<template>
  <div class="hours-to-limit">
    <!-- Filter Toggle -->
    <div class="toggle-group">
      <button
        v-for="r in ['1w', '1m', '3m', '6m', '1y']"
        :key="r"
        :class="{ active: selectedRange === r }"
        @click="selectedRange = r"
      >
        {{ r }}
      </button>
    </div>

    <!-- 4 Summary Cards -->
    <div v-if="summary" class="cards-grid">
      <div
        v-for="card in summary.cards"
        :key="card.key"
        class="limit-card"
        :class="{ warning: card.overLimit }"
      >
        <span class="card-label">{{ card.label }}</span>
        <strong class="card-hours">{{ card.hours }} hrs</strong>
        <span class="card-limit">Limit: {{ card.limit }} hrs</span>
        <div class="progress-bar">
          <div :style="{ width: Math.min(card.percent, 100) + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Chart Series Data -->
    <div v-if="summary" class="chart-wrapper">
      <p>Batas Regulasi (Limit Line): {{ summary.limit }} Jam (Y Max: {{ summary.yMax }})</p>
      <!-- Integrasikan dengan chart library pilihan (misal: ApexCharts, Chart.js, atau SVG custom) -->
    </div>
  </div>
</template>
```

---

### 4.3. Halaman Home: Daftar Dokumen Pilot

```vue
<script setup lang="ts">
const { data: docData } = await useApiFetch('/documents');

// Warna badge berdasarkan urgency:
// green  = safe
// amber  = soon
// red    = expired
function getBadgeColor(status: string) {
  if (status === 'expired') return '#EF4444'; // Red
  if (status === 'soon') return '#F59E0B';    // Amber
  return '#10B981';                           // Green
}
</script>

<template>
  <div class="documents-section">
    <h3>My Documents</h3>
    <ul v-if="docData">
      <li v-for="doc in docData.items" :key="doc.id" class="doc-item">
        <div class="doc-info">
          <span class="doc-title">{{ doc.label }}</span>
          <small>Berlaku hingga: {{ doc.expiryDate }}</small>
        </div>
        <span
          class="badge"
          :style="{ backgroundColor: getBadgeColor(doc.status) }"
        >
          {{ doc.daysRemaining <= 0 ? 'Expired' : `${doc.daysRemaining} hari lagi` }}
        </span>
      </li>
    </ul>
  </div>
</template>
```

---

### 4.4. Halaman Schedule: Kalender Bulanan

```vue
<script setup lang="ts">
import { ref } from 'vue';

const currentYear = ref(2026);
const currentMonth = ref(5); // Mei

const { data: scheduleData, refresh } = await useApiFetch('/schedules', {
  query: {
    year: currentYear,
    month: currentMonth,
  },
});

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}
</script>

<template>
  <div class="schedule-calendar">
    <div class="header">
      <button @click="prevMonth">&lt; Prev</button>
      <span>{{ currentYear }} - Bulan {{ currentMonth }}</span>
      <button @click="nextMonth">Next &gt;</button>
    </div>

    <div v-if="scheduleData" class="schedule-list">
      <div
        v-for="item in scheduleData.items"
        :key="item.id"
        class="duty-card"
        :style="{ borderLeft: `6px solid ${item.base_color}` }"
      >
        <div>
          <strong>{{ item.duty_date }} ({{ item.base_name }})</strong>
          <span>Tipe: {{ item.duty_type }}</span>
        </div>
        <div class="status-indicator">
          <!-- Centang jika sudah lengkap, atau sisa tugas -->
          <span v-if="item.completed">✅ Selesai</span>
          <span v-else class="remaining-badge">{{ item.remaining }} tugas tersisa</span>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## 🔒 5. Ringkasan Praktik Terbaik Keamanan

1. **Jaga Kerahasiaan Token**: Jangan menyimpan token di URL atau query parameter; gunakan selalu header `Authorization: Bearer <token>`.
2. **Penanganan Otomatis 401**: Bila server mengembalikan status HTTP `401 Unauthorized`, aplikasi harus otomatis menghapus token lokal dan mengarahkan pengguna ke halaman login.
3. **CORS (Cross-Origin Resource Sharing)**: Backend secara otomatis mengizinkan request dari frontend (dapat dikonfigurasi melalui variabel `CORS_ORIGIN`).
4. **Validasi Input**: Endpoint berparameter dilindungi validasi ketat. Pastikan format tanggal selalu `YYYY-MM-DD` dan format bulan `1 - 12`.
