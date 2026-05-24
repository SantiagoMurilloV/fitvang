# PROMPT FIGMA -- App FitVang

Copia y pega esto en Figma AI, o usalo como brief para disenar cada pantalla.

---

## SISTEMA DE DISENO

### Paleta de colores
- Background principal: #0D0D0D (negro profundo)
- Cards / superficies elevadas: #1A1A1A
- Acento primario: #3B82F6 (azul electrico vibrante -- se usa en CTAs, badges activos, indicadores de progreso, iconos activos)
- Dim / background tint: rgba(59,130,246,0.12)
- Texto principal: #FFFFFF
- Texto secundario: #888888
- Texto sobre fondo azul: #FFFFFF (blanco para maximo contraste)
- Bordes sutiles: rgba(255,255,255,0.08)
- Estado "al dia" / exito: #3B82F6
- Estado alerta / pendiente: #FF6B6B
- Estado neutro: #888888

### Tipografia
- Titulares y navegacion: Space Grotesk Bold (700), tracking -2%
- Cuerpo y datos: Inter Regular (400) / Medium (500) / SemiBold (600)
- Tamano base en movil: 14px
- Titulos de pantalla: 20px SemiBold
- Subtitulos / labels de seccion: 12px SemiBold uppercase, tracking +10%, color #888
- Datos grandes (stats): 32px Bold
- Texto de listas: 14px Regular
- Texto pequeno / captions: 11px Regular, color #888

### Espaciado
- Padding de pantalla: 20px horizontal, 16px vertical desde status bar
- Gap entre cards: 12px
- Padding dentro de cards: 16px
- Border radius cards: 16px
- Border radius botones: 12px (medianos), 999px (pills)
- Border radius inputs: 10px

### Componentes base
- Status bar: iOS style, blanco sobre fondo oscuro, hora a la izquierda, iconos de senal/wifi/bateria a la derecha
- Bottom nav bar: 5 iconos (Inicio, Horarios, Check-in, Pagos, Perfil), fondo #1A1A1A, icono activo en #3B82F6 con label, iconos inactivos en #888
- Boton primario: fondo #3B82F6, texto #FFFFFF, Bold, height 48px, border-radius 12px
- Boton secundario: borde 1px #888, texto #FFFFFF, fondo transparente
- Badge/pill: border-radius 999px, padding 4px 12px, texto 11px SemiBold
- Input field: fondo #1A1A1A, borde 1px rgba(255,255,255,0.08), texto blanco, placeholder #888, border-radius 10px, height 44px
- Divider: 1px solid rgba(255,255,255,0.06)

### Iconografia
- Estilo: outline, stroke 1.5px, esquinas redondeadas
- Tamano en nav: 24x24px
- Tamano en listas: 20x20px
- Color por defecto: #888, activo: #3B82F6

---

## PANTALLA 1 -- INICIO (Dashboard del usuario)

Frame: 390x844 (iPhone 14)
Fondo: #0D0D0D

### Contenido de arriba a abajo:

**Header**
- Saludo: "Hola, Carlos" (20px SemiBold, blanco)
- Subtexto: "Listo para entrenar hoy?" (14px Regular, #888)
- A la derecha: avatar circular 40x40 con iniciales "CM" sobre fondo #1A1A1A

**Card "Proxima clase" (card destacada)**
- Fondo: gradiente sutil de #1A1A1A a #222
- Border izquierdo: 4px solid #3B82F6
- Titulo: "Fuerza Funcional" (16px SemiBold, blanco)
- Subtexto: "Hoy - 5:00 PM | Coach Vang" (13px Regular, #888)
- Badge: "En 2 horas" (pill azul, texto blanco)
- Boton: "Reservar cupo" (boton primario pequeno, height 36px)

**Seccion "Tu semana"**
- Label: "ESTA SEMANA" (12px SemiBold uppercase, #888)
- 7 circulos horizontales representando L M M J V S D
- Dias con asistencia: relleno #3B82F6
- Dia actual: borde #3B82F6 sin relleno
- Dias futuros: fondo #1A1A1A
- Dias sin asistencia pasados: fondo #1A1A1A con un punto rojo sutil
- Debajo: "4 de 5 sesiones esta semana" (13px, #888)

**Seccion "Accesos rapidos"**
- Grid 2x2 de cards (fondo #1A1A1A, 16px border-radius)
- Card 1: Icono calendario + "Horarios" (tap abre pantalla horarios)
- Card 2: Icono QR + "Check-in" (tap abre escaner o codigo)
- Card 3: Icono billetera + "Mis pagos" (tap abre pantalla pagos)
- Card 4: Icono grafica + "Mi progreso" (tap abre estadisticas)
- Cada card: icono 24px en #3B82F6, label 13px SemiBold blanco, subtexto 11px #888

**Card "Estado de cuenta"**
- Fondo #1A1A1A
- "Plan Full" (14px SemiBold) + badge "Al dia" (pill azul vibrante, texto blanco)
- "Proximo cobro: 15 Jun 2026" (12px, #888)
- Barra de progreso fina representando dias restantes del ciclo (azul sobre #333)

**Bottom Navigation Bar** (activo: Inicio)

---

## PANTALLA 2 -- HORARIOS

Frame: 390x844
Fondo: #0D0D0D

### Contenido:

**Header**
- Titulo: "Horarios" (20px SemiBold)
- Subtexto: "Semana del 19 - 24 May" (13px, #888)
- Flechas izquierda/derecha para navegar semanas

**Selector de dias (tabs horizontales)**
- Fila de 6 pastillas: LUN 19, MAR 20, MIE 21, JUE 22, VIE 23, SAB 24
- Dia seleccionado: fondo #3B82F6, texto #FFFFFF, Bold
- Dias no seleccionados: fondo #1A1A1A, texto #888
- Tamano pastilla: auto width, height 40px, border-radius 12px, gap 8px
- Scroll horizontal si no caben

**Lista de clases del dia (cards apiladas, gap 12px)**

Card clase 1:
- Fondo #1A1A1A, border-radius 16px, padding 16px
- Fila superior: "6:00 AM" (14px SemiBold, #3B82F6) -- a la derecha: badge "4 cupos" (pill, borde #888, texto #888)
- Titulo: "Fuerza Funcional" (16px SemiBold, blanco)
- Subtexto: "Coach Vang | 60 min | Nivel intermedio" (12px, #888)
- Barra inferior: iconos de 3 avatares pequenos apilados (los inscritos) + "8/12 inscritos" (11px, #888) -- a la derecha: boton "Reservar" (boton primario pequeno)

Card clase 2:
- Hora: "8:00 AM" (#3B82F6)
- Titulo: "HIIT Quema Total"
- Coach: "Coach Daniela | 45 min | Nivel avanzado"
- "11/12 inscritos" -- badge "1 cupo" en rojo/alerta
- Boton "Reservar"

Card clase 3:
- Hora: "5:00 PM" (#3B82F6)
- Titulo: "Entrenamiento Dirigido"
- Coach: "Coach Vang | 60 min | Todos los niveles"
- "6/15 inscritos"
- Boton "Reservar"

Card clase 4:
- Hora: "7:00 PM" (#3B82F6)
- Titulo: "Movilidad y Recuperacion"
- Coach: "Coach Laura | 45 min | Todos los niveles"
- "3/10 inscritos"
- Boton "Reservar"

**Bottom Navigation Bar** (activo: Horarios)

---

## PANTALLA 3 -- DETALLE DE CLASE (al tocar una clase)

Frame: 390x844
Fondo: #0D0D0D

### Contenido:

**Header con back arrow**
- Flecha atras + "Fuerza Funcional" (18px SemiBold)

**Banner superior**
- Card grande fondo #1A1A1A, border-radius 20px
- Icono grande del tipo de entreno (pesa/dumbbell) en #3B82F6, 48x48
- Titulo: "Fuerza Funcional" (22px Bold)
- Tags en fila: "Intermedio" (pill borde #888) + "60 min" (pill borde #888) + "Fuerza" (pill fondo azul dim)

**Info del coach**
- Foto circular placeholder 48x48 + "Coach Vang" (14px SemiBold) + "Entrenador principal" (12px, #888)

**Seccion "Descripcion"**
- Label: "SOBRE ESTA CLASE" (12px uppercase, #888)
- Texto: "Sesion enfocada en movimientos compuestos de fuerza con barra y mancuernas. Incluye trabajo de movilidad articular y activacion del core. Ideal para quienes buscan ganar fuerza funcional aplicable al dia a dia." (14px, blanco)

**Seccion "Detalles"**
- Grid 2x2 de mini-cards:
  - Horario: "5:00 PM" con icono reloj
  - Duracion: "60 min" con icono timer
  - Cupos: "9 disponibles" con icono personas
  - Nivel: "Intermedio" con icono barra de nivel

**Seccion "Equipamiento"**
- Lista horizontal de pills: "Barra olimpica", "Mancuernas", "Rack", "Banda elastica"

**Seccion "Inscritos"**
- Fila de 8 avatares circulares pequenos (28x28) con iniciales, apilados con overlap de -8px
- "+ 4 mas" texto al final

**Boton fijo en la parte inferior**
- "Reservar mi cupo" (boton primario full width, height 52px)
- Debajo: "Cancelacion gratuita hasta 2 horas antes" (11px, #888, centrado)

---

## PANTALLA 4 -- CHECK-IN

Frame: 390x844
Fondo: #0D0D0D

### Contenido:

**Header**
- Titulo: "Check-in" (20px SemiBold)

**Estado: antes del check-in**

**Card principal (centrada verticalmente)**
- Fondo #1A1A1A, border-radius 24px, padding 32px, text-align center
- Icono QR grande (placeholder cuadrado 160x160, borde redondeado, fondo #222 con patron de QR simulado)
- Texto debajo: "Muestra este codigo al llegar" (14px, #888)
- Codigo numerico: "4 8 2 7" (32px Bold Space Grotesk, #3B82F6, letter-spacing 12px)
- Subtexto: "Codigo valido para hoy" (12px, #888)
- Linea divisoria
- Info de la clase: "Fuerza Funcional - 5:00 PM" (14px SemiBold, blanco)
- "Coach Vang" (12px, #888)

**Estado alternativo: despues del check-in (mostrar como segunda variante)**
- Misma card pero con fondo gradiente sutil hacia azul
- Icono: checkmark grande circular (#3B82F6, 64x64)
- Texto: "Check-in exitoso" (20px Bold, #3B82F6)
- "Fuerza Funcional - 5:00 PM" (14px, blanco)
- "Registrado a las 4:52 PM" (12px, #888)

**Historial rapido debajo**
- Label: "ULTIMOS CHECK-INS" (12px uppercase, #888)
- 3 filas:
  - "Hoy 5:00 PM - Fuerza Funcional" con check azul
  - "Ayer 6:00 AM - HIIT Quema Total" con check azul
  - "Lun 7:00 PM - Movilidad" con check azul

**Bottom Navigation Bar** (activo: Check-in)

---

## PANTALLA 5 -- MIS PAGOS

Frame: 390x844
Fondo: #0D0D0D

### Contenido:

**Header**
- Titulo: "Mis pagos" (20px SemiBold)

**Card de plan activo (card destacada)**
- Fondo #1A1A1A, borde izquierdo 4px #3B82F6
- Fila: "Plan Full" (16px SemiBold) + badge "Al dia" (pill fondo #3B82F6, texto #FFFFFF)
- Precio: "$280.000 / mes" (24px Bold, blanco)
- "Renovacion automatica" (12px, #888)
- Barra de progreso del ciclo: muestra que van 17 de 30 dias
- "Proximo cobro: 15 Jun 2026" (13px, #888)

**Seccion "Resumen del mes"**
- 3 mini-cards en fila horizontal:
  - "Sesiones": "18" (24px Bold, #3B82F6) + "de 22 disponibles" (11px, #888)
  - "Costo/sesion": "$15.556" (24px Bold, blanco) + "este mes" (11px, #888)  
  - "Desde": "Feb 2026" (24px Bold, blanco) + "4 meses activo" (11px, #888)

**Seccion "Historial de pagos"**
- Label: "HISTORIAL" (12px uppercase, #888)
- Lista de transacciones (cards #1A1A1A, gap 8px):

Fila 1:
- Izquierda: icono check circular azul + "Mayo 2026" (14px SemiBold) + "Plan Full - mensualidad" (12px, #888)
- Derecha: "$280.000" (14px SemiBold) + "15 May" (11px, #888)

Fila 2:
- "Abril 2026" + "Plan Full - mensualidad"
- "$280.000" + "15 Abr"

Fila 3:
- "Marzo 2026" + "Plan Full - mensualidad"
- "$280.000" + "15 Mar"

Fila 4:
- "Febrero 2026" + "Inscripcion + primer mes"
- "$380.000" + "8 Feb"

**Boton "Descargar recibo" (secundario, full width)**

**Bottom Navigation Bar** (activo: Pagos)

---

## PANTALLA 6 -- PERFIL

Frame: 390x844
Fondo: #0D0D0D

### Contenido:

**Header area**
- Avatar grande 72x72 circular, iniciales "CM" sobre fondo #3B82F6 con texto #FFFFFF
- "Carlos Mejia" (20px SemiBold, blanco)
- "Miembro desde Feb 2026" (13px, #888)
- Boton "Editar perfil" (boton secundario pequeno)

**Card de estadisticas**
- Fondo #1A1A1A, border-radius 16px
- Grid 3 columnas:
  - "72" (28px Bold, #3B82F6) + "sesiones totales" (11px, #888)
  - "82%" (28px Bold, blanco) + "asistencia" (11px, #888)
  - "12" (28px Bold, blanco) + "racha actual" (11px, #888)

**Seccion "Mi plan"**
- Card con info del plan actual, boton "Cambiar plan"

**Seccion "Opciones"**
- Lista de filas navegables (icono + label + flecha derecha):
  - "Notificaciones"
  - "Datos personales"
  - "Metodo de pago"
  - "Historial de asistencia"
  - "Soporte"
  - "Cerrar sesion" (texto en rojo #FF6B6B)

**Bottom Navigation Bar** (activo: Perfil)

---

## PANTALLA 7 -- MI ASISTENCIA (detalle)

Frame: 390x844
Fondo: #0D0D0D

### Contenido:

**Header**
- Titulo: "Mi asistencia" (20px SemiBold)
- Selector de mes: "<  Mayo 2026  >" con flechas

**Calendario mensual**
- Grid 7 columnas (L M M J V S D)
- Dias con asistencia: circulo relleno #3B82F6 con el numero en #FFFFFF
- Dia actual: borde #3B82F6, sin relleno, numero blanco
- Dias sin asistencia (pasados): numero en #888, sin circulo
- Dias futuros: numero en #333
- Dias del mes anterior/siguiente: invisibles o muy tenues

**Stats debajo del calendario**
- Card #1A1A1A con 3 datos en fila:
  - "18" sesiones completadas (de 22)
  - "82%" tasa de asistencia
  - "12 dias" racha actual

**Barra de progreso visual**
- Barra horizontal: 82% rellena en #3B82F6, resto en #333
- Labels: "0%" a la izquierda, "Meta: 90%" marcada con linea punteada, "100%" a la derecha

**Seccion "Detalle del mes"**
- Lista de las ultimas sesiones:
  - "Vie 16 May - 5:00 PM - Fuerza Funcional" + check azul
  - "Jue 15 May - 6:00 AM - HIIT Quema Total" + check azul
  - "Mie 14 May - 7:00 PM - Movilidad" + check azul
  - "Mar 13 May - 5:00 PM - Entrenamiento Dirigido" + check azul
  - (mas filas...)

**Bottom Navigation Bar** (activo: Inicio, ya que es sub-pantalla)

---

## PANTALLA 8 -- PANEL ADMIN: DASHBOARD

Frame: 390x844
Fondo: #0D0D0D

### Contenido:

**Header**
- "Panel FitVang" (20px SemiBold, #3B82F6)
- "Hoy, 17 Mayo 2026" (13px, #888)
- Icono de campana con badge rojo (notificaciones)

**Stats del dia (3 cards en fila)**
- Card 1: "32" (28px Bold, #3B82F6) + "check-ins hoy" (11px, #888)
- Card 2: "4" (28px Bold, #FF6B6B) + "pagos pendientes" (11px, #888)
- Card 3: "47" (28px Bold, blanco) + "usuarios activos" (11px, #888)

**Seccion "Clases de hoy"**
- Label: "CLASES DE HOY" (12px uppercase, #888)
- Cards con resumen de cada clase:
  
Card 1:
- "6:00 AM - Fuerza Funcional" (14px SemiBold)
- Barra de asistencia: "10/12" con barra azul
- "Coach Vang" (12px, #888)

Card 2:
- "8:00 AM - HIIT Quema Total"
- "12/12 LLENO" con barra completa en azul
- "Coach Daniela"

Card 3:
- "5:00 PM - Entrenamiento Dirigido"
- "6/15" con barra parcial
- "Coach Vang"

**Seccion "Pagos pendientes" (alerta)**
- Card fondo #1A1A1A, borde izquierdo 4px #FF6B6B
- Lista compacta:
  - "Andres Lopez - $280.000 - Vence hoy"
  - "Maria Ruiz - $280.000 - Vencido 3 dias"
  - "Juan Torres - $180.000 - Vencido 5 dias"
- Boton "Ver todos los pagos"

**Acciones rapidas (2 botones)**
- "Registrar asistencia manual" (boton primario)
- "Agregar usuario" (boton secundario)

**Bottom Nav (admin)**: Dashboard, Usuarios, Clases, Pagos, Config

---

## PANTALLA 9 -- PANEL ADMIN: LISTA DE USUARIOS

Frame: 390x844
Fondo: #0D0D0D

### Contenido:

**Header**
- Titulo: "Usuarios" (20px SemiBold)
- Barra de busqueda: input con icono lupa, placeholder "Buscar por nombre..."
- Filtros pill: "Todos (47)", "Al dia (39)", "Pendientes (4)", "Inactivos (4)"
  - Filtro activo: fondo #3B82F6, texto #FFFFFF
  - Filtros inactivos: fondo #1A1A1A, texto #888

**Lista de usuarios (cards apiladas, gap 8px)**

Usuario 1:
- Avatar 40x40 "CM" + "Carlos Mejia" (14px SemiBold) + "Plan Full" (12px, #888)
- Badge "Al dia" (pill azul vibrante, texto blanco)
- "Ultima sesion: Hoy" (11px, #888)

Usuario 2:
- Avatar "AL" + "Andres Lopez" + "Plan Full"
- Badge "Pendiente" (pill fondo #FF6B6B, texto blanco)
- "Ultimo pago vence hoy"

Usuario 3:
- Avatar "MR" + "Maria Ruiz" + "Plan Full"
- Badge "Vencido" (pill rojo)
- "Vencido hace 3 dias"

Usuario 4:
- Avatar "LG" + "Laura Gomez" + "Plan Basico"
- Badge "Al dia"
- "Ultima sesion: Ayer"

(Mas usuarios...)

**Boton flotante "+" en esquina inferior derecha** (circulo #3B82F6, icono + en blanco, 56x56)

**Bottom Nav (admin)** (activo: Usuarios)

---

## PANTALLA 10 -- PANEL ADMIN: GESTION DE PAGOS

Frame: 390x844
Fondo: #0D0D0D

### Contenido:

**Header**
- Titulo: "Pagos" (20px SemiBold)
- Selector de mes: "<  Mayo 2026  >"

**Resumen del mes (card grande)**
- Fondo #1A1A1A
- "Ingresos Mayo" (12px uppercase, #888)
- "$8.940.000" (32px Bold, #3B82F6)
- Grid debajo: "32 cobrados" | "4 pendientes" | "$1.120.000 por cobrar"
- Barra de progreso: 89% cobrado

**Filtros**: "Todos", "Cobrados", "Pendientes", "Vencidos"

**Lista de pagos**

Pago 1:
- "Carlos Mejia" + "Plan Full"
- "$280.000" + badge "Cobrado" (azul)
- "15 May 2026"

Pago 2:
- "Andres Lopez" + "Plan Full"
- "$280.000" + badge "Pendiente" (amarillo)
- "Vence hoy"

Pago 3:
- "Maria Ruiz" + "Plan Full"
- "$280.000" + badge "Vencido" (rojo)
- "Vencio 14 May"

(Mas pagos...)

**Cada fila de pago tiene menu contextual (3 dots) con opciones: "Marcar como cobrado", "Enviar recordatorio", "Ver historial"**

**Bottom Nav (admin)** (activo: Pagos)

---

## PANTALLA 11 -- PANEL ADMIN: CONFIGURAR HORARIOS

Frame: 390x844
Fondo: #0D0D0D

### Contenido:

**Header**
- Titulo: "Clases" (20px SemiBold)
- Boton "+ Nueva clase" (boton primario pequeno)

**Vista semanal (tabs de dias)**
- Mismos tabs que pantalla de horarios del usuario

**Lista de clases configuradas**

Cada card de clase incluye:
- Hora + Nombre de clase + Coach asignado
- Cupo maximo editable: "12 cupos"
- Toggle activo/inactivo (switch azul vibrante)
- Boton editar (icono lapiz) y boton eliminar (icono basura, rojo)

Card ejemplo:
- "6:00 AM" (#3B82F6)
- "Fuerza Funcional"
- "Coach Vang | 60 min"
- "Cupo: 12" + "Nivel: Intermedio"
- Switch ON (azul)
- Iconos de editar/eliminar

**Bottom Nav (admin)** (activo: Clases)

---

## PANTALLA 12 -- LOGIN / REGISTRO

Frame: 390x844
Fondo: #0D0D0D

### Contenido:

**Centrado verticalmente:**

- Logo "FITVANG" grande (28px Bold, Space Grotesk, #3B82F6, letter-spacing 6px)
- Subtexto: "Entrena con proposito" (14px, #888)

**Formulario de login:**
- Input "Correo electronico" (icono sobre/mail)
- Input "Contrasena" (icono candado, toggle mostrar/ocultar)
- Link "Olvidaste tu contrasena?" alineado a la derecha (12px, #3B82F6)
- Boton "Iniciar sesion" (primario, full width)
- Divider: "--- o ---"
- Boton "Continuar con Google" (secundario, full width, con icono de Google)
- Texto inferior: "No tienes cuenta? Registrate" donde "Registrate" es link en #3B82F6

**Variante de registro (segunda frame):**
- Misma estructura pero con campos:
  - Nombre completo
  - Correo electronico
  - WhatsApp
  - Contrasena
  - Selector de plan: 3 opciones (Basico/Full/Premium) como cards seleccionables
- Boton "Crear mi cuenta"
- "Ya tienes cuenta? Inicia sesion"

---

## NOTAS PARA EL DISENADOR

1. Todas las pantallas comparten el mismo frame size (390x844) y el mismo bottom nav bar
2. Usa Auto Layout en todo para que sea facil adaptar contenido
3. Los componentes que se repiten (cards de clase, filas de usuario, filas de pago) deben ser componentes reutilizables con variantes
4. Crea un frame de "Design System" separado con todos los colores, tipografias, componentes base, iconos y estados
5. Las pantallas de admin y de usuario comparten estilos pero tienen bottom nav diferente
6. Prioridad de diseno: Horarios > Dashboard > Pagos > Check-in > Admin Dashboard > resto
7. Todas las interacciones criticas (reservar, check-in, pagar) deben tener estados: default, loading, success, error
8. El tono visual es: oscuro, premium, energetico pero limpio. No recargado. Espacio generoso entre elementos.
