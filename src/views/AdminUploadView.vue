<template>
  <div class="admin-upload-page">
    <div class="glass-container">
      <div class="header">
        <button class="back-btn" @click="$router.push('/')">← Volver al Inicio</button>
        <h2 class="title">📄 Panel de Carga de Normativa (RAG)</h2>
        <p class="subtitle">Sube los archivos PDF de las Leyes de Tránsito para sincronizarlos con la base vectorial (Qdrant Cloud).</p>
      </div>

      <!-- Drop Zone -->
      <div 
        class="drop-zone"
        :class="{ 'is-dragging': isDragging, 'is-loading': isLoading }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input 
          type="file" 
          ref="fileInput" 
          multiple 
          accept="application/pdf" 
          style="display: none;" 
          @change="handleFileSelect" 
        />
        
        <div class="drop-icon">
          <span v-if="!isLoading">📤</span>
          <span v-else class="spin">🔄</span>
        </div>
        
        <div v-if="!isLoading">
          <p class="drop-text">Arrastra y suelta tus archivos PDF aquí</p>
          <p class="drop-subtext">o haz clic para explorar en tu equipo</p>
        </div>
        <div v-else>
          <p class="drop-text">Procesando normativa y creando vectores...</p>
          <p class="drop-subtext">Esto puede demorar unos segundos por cada documento</p>
        </div>
      </div>

      <!-- Selected Files Preview -->
      <div v-if="selectedFiles.length > 0" class="file-list-card">
        <h3>Archivos Seleccionados ({{ selectedFiles.length }})</h3>
        <ul class="file-list">
          <li v-for="(file, index) in selectedFiles" :key="index" class="file-item">
            <span class="file-name">📄 {{ file.name }}</span>
            <span class="file-size">({{ (file.size / (1024 * 1024)).toFixed(2) }} MB)</span>
            <button class="remove-btn" @click.stop="removeFile(index)" :disabled="isLoading">✕</button>
          </li>
        </ul>

        <div class="actions">
          <button class="upload-btn" @click="uploadFiles" :disabled="isLoading || selectedFiles.length === 0">
            {{ isLoading ? '⏳ Subiendo y procesando...' : '🚀 Iniciar Ingesta Vectorial' }}
          </button>
        </div>
      </div>

      <!-- Result Banner -->
      <div v-if="uploadResult" class="result-box" :class="{ 'has-errors': uploadResult.errors && uploadResult.errors.length > 0 }">
        <h3>✅ Ingesta Completada</h3>
        <p><strong>Archivos procesados:</strong> {{ uploadResult.processedFiles ? uploadResult.processedFiles.join(', ') : 0 }}</p>
        <p><strong>Vectores/Fragmentos generados:</strong> {{ uploadResult.totalChunks || 0 }}</p>
        
        <div v-if="uploadResult.errors && uploadResult.errors.length > 0" class="errors-box">
          <p>⚠️ Errores durante la ingesta:</p>
          <ul>
            <li v-for="(err, i) in uploadResult.errors" :key="i">{{ err }}</li>
          </ul>
        </div>

        <button class="go-chat-btn" @click="$router.push('/chat')">💬 Ir al Chat a Probar</button>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="error-banner">
        ⚠️ {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const fileInput = ref(null);
const selectedFiles = ref([]);
const isDragging = ref(false);
const isLoading = ref(false);
const uploadResult = ref(null);
const errorMessage = ref('');

function triggerFileInput() {
  if (fileInput.value) fileInput.value.click();
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
  selectedFiles.value = [...selectedFiles.value, ...files];
  uploadResult.value = null;
  errorMessage.value = '';
}

function handleDrop(e) {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
  selectedFiles.value = [...selectedFiles.value, ...files];
  uploadResult.value = null;
  errorMessage.value = '';
}

function removeFile(index) {
  selectedFiles.value.splice(index, 1);
}

async function uploadFiles() {
  if (selectedFiles.value.length === 0) return;

  isLoading.value = true;
  errorMessage.value = '';
  uploadResult.value = null;

  const formData = new FormData();
  selectedFiles.value.forEach(file => {
    formData.append('files', file);
  });

  const apiBase = import.meta.env.VITE_API_URL || '';

  try {
    const res = await fetch(`${apiBase}/api/documents/upload`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}: Error al subir archivos`);
    }

    const data = await res.json();
    uploadResult.value = data;
    selectedFiles.value = [];
  } catch (err) {
    console.error('Error en ingesta:', err);
    errorMessage.value = err.message || 'Error de conexión con el servidor backend.';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.admin-upload-page {
  width: 100vw;
  min-height: 100vh;
  background: #0f172a;
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
}

.glass-container {
  width: 100%;
  max-width: 680px;
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 36px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

.header {
  margin-bottom: 28px;
}

.back-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #94a3b8;
  border-radius: 10px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s;
}
.back-btn:hover {
  color: white;
  border-color: #0db37b;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.5;
}

.drop-zone {
  border: 2px dashed rgba(13, 179, 123, 0.4);
  background: rgba(13, 179, 123, 0.05);
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.drop-zone:hover, .drop-zone.is-dragging {
  border-color: #0db37b;
  background: rgba(13, 179, 123, 0.15);
}

.drop-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.spin {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.drop-text {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
}

.drop-subtext {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.file-list-card {
  margin-top: 24px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
}

.file-list-card h3 {
  font-size: 14px;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  margin-bottom: 8px;
  font-size: 14px;
}

.file-name {
  color: #f1f5f9;
  font-weight: 500;
  word-break: break-all;
}

.file-size {
  color: #64748b;
  font-size: 12px;
  margin-left: 8px;
}

.remove-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 8px;
}

.upload-btn {
  width: 100%;
  background: linear-gradient(135deg, #0fcf8c, #099464);
  color: white;
  border: none;
  border-radius: 14px;
  padding: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(13, 179, 123, 0.3);
  transition: transform 0.2s;
}

.upload-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-box {
  margin-top: 24px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 16px;
  padding: 20px;
}

.result-box h3 {
  color: #34d399;
  font-size: 18px;
  margin-bottom: 10px;
}

.result-box p {
  font-size: 14px;
  color: #e2e8f0;
  margin: 4px 0;
}

.errors-box {
  margin-top: 12px;
  background: rgba(239, 68, 68, 0.15);
  border-radius: 8px;
  padding: 10px;
  color: #fca5a5;
  font-size: 13px;
}

.go-chat-btn {
  margin-top: 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.error-banner {
  margin-top: 20px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  padding: 14px;
  border-radius: 12px;
  font-size: 14px;
}
</style>
