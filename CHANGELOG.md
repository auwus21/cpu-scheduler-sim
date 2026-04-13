# Changelog

Todas las actualizaciones importantes del proyecto están documentadas acá.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), y el proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.1.0] - 2026-04-13

### Agregado
- **Sidebar colapsable:** Botón para ocultar/mostrar el panel izquierdo y ganar espacio horizontal en el diagrama de Gantt.
- **R Queue editable en Modo Práctica:** Cada celda de la cola de listos ahora se puede completar manualmente como borrador, sin afectar la corrección.
- **Vercel Analytics:** Integración con `@vercel/analytics` para medir tráfico y uso real del simulador.

### Mejorado
- **Exportación a imagen:** Al exportar en modo práctica corregido, la captura ahora sale limpia (sin marcas de corrección ni el texto "Completalo vos").
- **Instrucciones del modo práctica:** Se actualizó el texto de ayuda para reflejar que la R Queue es opcional y editable.

### Corregido
- Texto duplicado "Ctrl+Z para deshacer" en las instrucciones del modo práctica.
- Limpieza del estado de la R Queue al reiniciar o generar un nuevo ejercicio.

---

## [1.0.0] - 2026-04-04

### Agregado
- **Motor de simulación completo** con 7 algoritmos: FCFS, SJF, SRTF, Round Robin (Timer Variable), Round Robin (Timer Fijo), Prioridades No Expulsivo y Prioridades Expulsivo.
- **Diagrama de Gantt animado** con numeración secuencial por proceso, bordes de segmento y colores diferenciados.
- **Módulo de I/O (Entrada/Salida):** Soporte para ráfagas de I/O con recursos múltiples (R1, R2, R3), colas de bloqueados y visualización en el Gantt.
- **Modo Práctica:** Generador de ejercicios aleatorios con 3 niveles de dificultad (Fácil, Medio, Difícil). El usuario pinta las celdas del Gantt manualmente y el sistema corrige mostrando aciertos, errores y faltantes.
- **Sistema de corrección** con puntaje desglosado (Gantt CPU, I/O, Métricas TR/TE).
- **Historial de práctica** persistente en localStorage con logros desbloqueables.
- **Compartir ejercicios** mediante código codificado en Base64, con importación/exportación.
- **Exportación a PNG** del diagrama de Gantt completo.
- **Guía de estudio integrada** con explicación teórica de cada algoritmo, pseudocódigo, ventajas/desventajas y uso en el mundo real.
- **Tabla de métricas** con Tiempo de Retorno (TR), Tiempo de Espera (TE) y promedios.
- **Ready Queue visual** en modo simulación (calculada automáticamente tick a tick).
- **Deshacer/Rehacer** (Ctrl+Z / Ctrl+Y) en modo práctica.
- **Diseño responsive** adaptado a desktop, tablet y móvil.
- **Branding completo:** Favicon, logo SVG, footer con links a GitHub y LinkedIn.
- **Despliegue automático** con GitHub Actions y hosting en Vercel + subdominio personalizado.
- **README profesional** con banner, badges de tecnologías y documentación de instalación.
- **Comentarios en español** en todo el código fuente para facilitar la colaboración académica.
