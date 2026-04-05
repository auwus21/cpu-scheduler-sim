<div align="center">
  <img src="https://raw.githubusercontent.com/AGUSTIN/cpu-scheduler-sim/main/public/cpu-icon.svg" width="120" alt="CPU Scheduler Sim Icon" />
  <h1>CPU Scheduler Sim</h1>
  <p><em>Simulador web de algoritmos de planificación de CPU interactivo.</em></p>
</div>

---

**CPU Scheduler Sim** es una herramienta educativa diseñada para visualizar, practicar y entender cómo los sistemas operativos administran la CPU. Incluye soporte completo para algoritmos con y sin ráfagas de entrada/salida (I/O).

Desarrollado para estudiantes y docentes vinculados a la materia **Introducción a los Sistemas Operativos (ISO) - UNLP**.

## ✨ Características

- 📊 **Representación Visual (Gantt):** Generación automática de diagramas de Gantt paso a paso con animaciones.
- ⚙️ **7 Algoritmos Clásicos:** FCFS (FIFO), SJF, SRTF, Round Robin (Variable y Fijo), y Prioridades (Expulsivo y No Expulsivo).
- 💾 **Soporte I/O Avanzado:** Panel integrado para diseñar procesos de I/O en tiempo real y simular bloqueos (DMA).
- 🏆 **Modo Práctica:** Generador de ejercicios aleatorios que te corrige paso a paso.
- 🎮 **Gamificación:** Sistema de puntuación y logros (ej. "Master RR", "Excelencia").
- 🔗 **Exportación Compartida:** Copia códigos de desafío o descarga tu diagrama en `png` para entregas.

## 🛠 Instalación Local

Si te interesa correr o aportar al proyecto en tu computadora localmente:

1. Cloná o descargá el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/cpu-scheduler-sim.git
   ```
2. Entrá a la carpeta:
   ```bash
   cd cpu-scheduler-sim
   ```
3. Instalá las dependencias usando NPM (requiere [Node.js](https://nodejs.org/)):
   ```bash
   npm install
   ```
4. Ejecutá el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abrí el link que se te genera (probablemente `http://localhost:5173`) en tu navegador web.

## 🧠 Tecnologías Utilizadas

- **React 18** (Librería principal).
- **Vite** (Compilador y bundler ultra-rápido).
- **CSS Vanilla (Modular)** (Vanguardia de diseño glassmorphism y variables nativas).
- **Vercel / GitHub Pages** (Despliegue).

## 📄 Licencia

Este proyecto está liberado bajo la filosofía Open Source para todo uso educativo.

---
*Hecho por [Tu Nombre / Agustín] con cariño para los estudiantes de Informática.*
