ESPECIFICACIÓN DE REQUISITOS DE SOFTWARE (ERS)

Sistema de Gestión para Gimnasio

Versión 1.0

Fecha: agosto de 2026

Documento base: información funcional suministrada por el cliente

Convenciones: los elementos marcados como [PROPUESTA] son funcionalidades sugeridas, no solicitadas originalmente, pendientes de aprobación del cliente. Los marcados [FASE 2] corresponden a alcance confirmado para una etapa posterior del proyecto.

# 1. Introducción

## 1.1 Propósito

Este documento especifica los requisitos funcionales y no funcionales del Sistema de Gestión para Gimnasio, con el fin de servir de base para su diseño, desarrollo y validación. Consolida la información suministrada por el cliente y las decisiones tomadas conjuntamente durante el levantamiento de requisitos.

## 1.2 Alcance

El sistema será una aplicación web de uso interno para una única sede del gimnasio. Permitirá administrar clientes, membresías, pagos y abonos, entrenadores, egresos, inventario básico e información financiera, mediante dos roles de usuario: Administrador y Recepcionista. Adicionalmente, se contempla para una fase posterior (Fase 2) el control de ingreso y salida de clientes mediante huella digital.

Quedan fuera del alcance de esta versión: soporte multi-sede, facturación electrónica ante autoridades fiscales, y pagos en línea; estos podrán evaluarse en futuras iteraciones.

## 1.3 Definiciones, acrónimos y abreviaturas

| Término | Definición |
| --- | --- |
| ERS | Especificación de Requisitos de Software. |
| RF | Requisito Funcional. |
| RNF | Requisito No Funcional. |
| RN | Regla de Negocio. |
| Abono | Pago parcial de una membresía, registrado como 1er abono, 2do abono o abono final. |
| Mora | Estado del cliente cuando la fecha de vencimiento de su membresía se cumplió sin pago que la renueve. |
| Quincena | Membresía con vigencia de 15 días calendario contados desde la fecha de inicio. |
| Novedad | Evento relevante asociado a un cliente en el apartado diario (ej. observaciones, incidentes). |

## 1.4 Referencias

Documento fuente: información funcional del gimnasio suministrada por el cliente (datos de usuarios, tipos de membresía, manejo financiero y distribución de secciones), complementada con las respuestas dadas durante la fase de aclaración de requisitos.

## 1.5 Visión general del documento

La sección 2 describe de forma general el producto y sus usuarios. La sección 3 detalla los requisitos funcionales por módulo. La sección 4 documenta las reglas de negocio (tarifas, abonos mínimos, comisiones). La sección 5 presenta los requisitos no funcionales. La sección 6 describe el modelo de datos preliminar. La sección 7 lista los casos de uso principales. La sección 8 recoge los supuestos y temas pendientes de definición, y la sección 9 resume las funcionalidades propuestas.

# 2. Descripción general

## 2.1 Perspectiva del producto

El sistema es un producto nuevo, independiente, orientado a reemplazar el control manual/informal de la información del gimnasio (clientes, pagos, entrenadores y finanzas) por una herramienta web centralizada.

## 2.2 Roles de usuario y matriz de permisos

Se definen dos roles de usuario del sistema:

Administrador: acceso completo. Es el único rol que puede gestionar tipos de membresía, entrenadores, egresos, inventario y consultar la información financiera consolidada (finanzas y reportes).

Recepcionista: gestión operativa diaria — registrar clientes nuevos, gestionar asistencia, registrar pagos/abonos y llevar el apartado diario.

Nota: el rol Recepcionista puede registrar el cobro de un pago (transacción puntual), pero no tiene acceso a los reportes financieros consolidados (balances, utilidad acumulada), los cuales son exclusivos del Administrador.

| Módulo / Funcionalidad | Administrador | Recepcionista |
| --- | --- | --- |
| Registro y edición de clientes | ✔ | ✔ |
| Registro de asistencia | ✔ | ✔ |
| Registro de pagos y abonos | ✔ | ✔ |
| Apartado diario (bitácora del día) | ✔ | ✔ |
| Tipos de membresía (crear / editar / eliminar) | ✔ | ✘ |
| Entrenadores (registro y pagos) | ✔ | ✘ |
| Egresos | ✔ | ✘ |
| Inventario | ✔ | ✘ |
| Finanzas y reportes consolidados (balances, ingresos históricos) | ✔ | ✘ |
| Categorías de egreso (configuración) | ✔ | ✘ |

## 2.3 Restricciones

El sistema opera para una única sede del gimnasio (no se requiere soporte multi-sucursal).

En esta fase no se contempla facturación electrónica ante autoridades fiscales; el manejo financiero es de control interno.

El control de acceso mediante huella digital queda planeado para una Fase 2 del proyecto.

## 2.4 Supuestos y dependencias

El alcance detallado del módulo de Inventario (qué ítems específicos se controlarán) se define de forma general en este documento y deberá afinarse en una siguiente iteración con el cliente.

Las membresías Quincena, Semana, Día y las promociones (amigos/familiar, folleto físico) se asumen de pago completo (sin abono), dado que no se definieron montos mínimos de abono para ellas.

El estado "En mora" se activa automáticamente al cumplirse la fecha de vencimiento sin un pago registrado que renueve la membresía.

El criterio de "disponibilidad" de un entrenador (por ejemplo, cupo máximo de clientes o franjas horarias) deberá definirse con mayor detalle en una siguiente iteración.

# 3. Requisitos funcionales

## 3.1 Autenticación y control de acceso

| ID | Descripción del requisito |
| --- | --- |
| RF-01 | El sistema debe permitir el inicio de sesión mediante usuario y contraseña para el personal del gimnasio (Administrador y Recepcionista). |
| RF-02 | El sistema debe restringir el acceso a cada módulo según el rol autenticado, conforme a la matriz de permisos (numeral 2.2). |
| RF-03 | El sistema debe registrar en un log de auditoría las acciones relevantes (creación, edición, eliminación) realizadas por cada usuario, especialmente en el módulo financiero.  [PROPUESTA] |

## 3.2 Gestión de clientes

| ID | Descripción del requisito |
| --- | --- |
| RF-04 | El sistema debe permitir registrar un nuevo cliente con los siguientes datos: nombre completo, documento de identidad, teléfono, correo electrónico, contacto de emergencia, forma de pago, tipo de membresía, tipo de sangre, fecha de cumpleaños, condición médica (o "N/A") y comentarios/novedades. |
| RF-05 | El sistema debe permitir editar la información de un cliente ya registrado. |
| RF-06 | La fecha de ingreso debe asignarse automáticamente con la fecha del día del registro, pero debe poder editarse manualmente cuando el cliente inicie su membresía en una fecha distinta. |
| RF-07 | El sistema debe calcular automáticamente la fecha de vencimiento de la membresía a partir de la fecha de ingreso y el tipo de membresía seleccionado. |
| RF-08 | El sistema debe permitir asignar y actualizar el estado del cliente entre: Activo, Inactivo y En mora. |
|  |  |
| RF-10 | El sistema debe enviar una notificación automática (WhatsApp y correo) unos días antes del vencimiento de la membresía del cliente.  [PROPUESTA] |
| RF-11 | El sistema debe enviar un mensaje automático de felicitación en la fecha de cumpleaños de cada cliente.  [PROPUESTA] |

## 3.3 Membresías

| ID | Descripción del requisito |
| --- | --- |
| RF-12 | El sistema debe permitir al Administrador crear, editar y eliminar tipos de membresía (nombre, valor y condiciones). |
| RF-13 | El sistema debe mantener por defecto el catálogo de membresías descrito en el numeral 4.1 (Reglas de negocio). |
| RF-14 | El sistema debe aplicar la tarifa promocional de "amigos/familiar" ($60.000 por persona) cuando 3 o más clientes registren el pago de su mensualidad el mismo día, de forma indefinida mientras continúen pagando juntos el mismo día. |
| RF-15 | El sistema debe permitir aplicar la promoción de "folleto físico" ($55.000) únicamente a clientes nuevos, en el momento de su inscripción. |
| RF-16 | Para las membresías "Personalizada" y "Semipersonalizadas", el sistema debe registrar automáticamente la distribución del pago entre el entrenador asignado y el negocio, según los montos definidos en el numeral 4.1. |

## 3.4 Pagos y abonos

| ID | Descripción del requisito |
| --- | --- |
| RF-17 | El sistema debe permitir registrar el pago de una membresía, ya sea de forma completa o parcial (abono). |
| RF-18 | Cuando el pago sea parcial, el sistema debe calcular y mostrar el saldo pendiente del cliente. |
| RF-19 | El sistema debe validar que el valor del abono no sea inferior al abono mínimo definido para el tipo de membresía (numeral 4.3). |
| RF-20 | El sistema debe etiquetar cada abono registrado como "1er abono", "2do abono" o "abono final", según corresponda, hasta completar el valor total de la membresía. |
| RF-21 | El sistema debe actualizar automáticamente el estado del cliente a "En mora" cuando se cumpla la fecha de vencimiento sin que se haya registrado un pago que renueve la membresía. |

## 3.5 Entrenadores

| ID | Descripción del requisito |
| --- | --- |
| RF-22 | El sistema debe permitir al Administrador registrar entrenadores con: nombre, documento, teléfono, certificados si aplica, fecha de contratación y sueldo. |
| RF-23 | El sistema debe llevar un registro con evidencias por entrenador de los pagos generados por sus clientes de plan Personalizado o Semipersonalizado (comisiones). |
| RF-24 | Al inscribir a un cliente en un plan Personalizado o Semipersonalizado, el sistema debe permitir seleccionar el entrenador de su preferencia, sujeto a la disponibilidad del entrenador. |
| RF-25 | El sistema debe mostrar la disponibilidad de cada entrenador para apoyar la asignación de clientes. |

## 3.6 Egresos

| ID | Descripción del requisito |
| --- | --- |
| RF-26 | El sistema debe permitir registrar egresos indicando categoría, concepto/justificación, valor y fecha. |
| RF-27 | El sistema debe mantener un catálogo fijo de categorías de egreso (por ejemplo: nómina, mantenimiento, servicios públicos, insumos de aseo/antibacteriales), que el Administrador pueda ampliar o eliminar. |

## 3.7 Inventario

| ID | Descripción del requisito |
| --- | --- |
| RF-28 | El sistema debe permitir registrar ítems de inventario con nombre, cantidad y unidad de medida. |
| RF-29 | El sistema debe permitir definir un nivel mínimo de existencias por ítem. |
| RF-30 | El sistema debe generar una alerta cuando el inventario de un ítem se encuentre por debajo del mínimo definido.  [PROPUESTA] |

## 3.8 Finanzas y reportes

| ID | Descripción del requisito |
| --- | --- |
| RF-31 | El sistema debe mostrar el balance financiero diario, semanal y mensual (ingresos frente a egresos). |
| RF-32 | El balance mensual general debe mostrar la utilidad acumulada respecto a meses anteriores y permitir registrar observaciones al cierre de cada mes (por ejemplo, pagos pendientes). |
| RF-33 | El sistema debe mostrar el número de clientes con membresía activa. |
| RF-34 | El apartado diario (bitácora) debe mostrar, para el día en curso: ingresos del día, clientes nuevos registrados (nombre, teléfono, forma de pago, tipo de membresía) y novedades del día, con un campo de observaciones. |
| RF-35 | El sistema debe incluir un panel (dashboard) con indicadores clave: ingresos del mes, clientes activos, clientes en mora y comparación con el mes anterior.  [PROPUESTA] |

## 3.9 Asistencia y control biométrico

| ID | Descripción del requisito |
| --- | --- |
| RF-36 | El sistema debe permitir registrar el ingreso y la salida de los clientes mediante huella digital.  [FASE 2] |
| RF-37 | A partir del registro de asistencia, el sistema debe permitir identificar cuándo un cliente dejó de asistir, para evaluar el estado de su membresía (mora, posible retiro).  [FASE 2] |
| RF-38 | El sistema debe mantener un historial de asistencia por cliente para análisis de frecuencia de uso.  [PROPUESTA] |
| RF-39 | El sistema debe generar alertas de mantenimiento preventivo para las máquinas del gimnasio con base en fechas programadas.  [PROPUESTA] |

## 3.10 Respaldo de información

| ID | Descripción del requisito |
| --- | --- |
| RF-40 | El sistema debe generar copias de seguridad automáticas y periódicas de la información almacenada.  [PROPUESTA] |

# 4. Reglas de negocio

## 4.1 Catálogo de membresías

| Tipo de membresía | Valor | Condiciones | Abono mínimo |
| --- | --- | --- | --- |
| Mensualidad (lunes a sábado) | $65.000 | Acceso todos los días, lunes a sábado, vigencia de 1 mes. | $30.000 |
| Mes 3 veces por semana | $50.000 | 3 días a la semana, organizables libremente por el cliente durante 1 mes (ej.: inicia 1 jun., vence 1 jul.). | $30.000 |
| Quincena | $45.000 | Vigencia de 15 días calendario desde la fecha de inicio (ej.: inicia 15 jun., vence 30 jun.). | Pago completo |
| Semana | $25.000 | Vigencia de 7 días. | Pago completo |
| Día | $6.000 | Vigencia de 1 día. | Pago completo |
| Promo amigos/familiar | $60.000 c/u | Aplica cuando 3 o más clientes pagan su mensualidad juntos el mismo día; se mantiene de forma indefinida mientras sigan pagando juntos dentro de un lapso de 3 dias. | Pago completo |
| Promo folleto físico | $55.000 | Solo para clientes nuevos que presenten el folleto físico al inscribirse; aplica al primer mes. | Pago completo |
| Personalizado | $200.000 | Entrenamiento personalizado 1 a 1. Se distribuye $100.000 para el entrenador asignado y $100.000 para el negocio. | $100.000 |
| Semipersonalizado | $150.000 | Entrenamiento semipersonalizado. Se distribuye $75.000 para el entrenador asignado y $75.000 para el negocio. | $75.000 |

## 4.2 Estados del cliente

| Estado | Descripción |
| --- | --- |
| Activo | El cliente tiene una membresía vigente y al día. |
| Inactivo | El cliente se retiró o no cuenta con una membresía activa. |
| En mora | Se cumplió la fecha de vencimiento de la membresía sin un pago registrado que la renueve. |

Nota: no se contempla un estado "congelado"; las membresías no pueden pausarse ni suspenderse temporalmente.

## 4.3 Abonos mínimos por tipo de membresía

| Tipo de membresía | Abono mínimo |
| --- | --- |
| Mensualidad (lunes a sábado) | $30.000 |
| Mensualidad (3 días por semana) | $30.000 |
| Personalizado | $100.000 |
| Semipersonalizado | $75.000 |
| Quincena, Semana, Día y promociones | No admiten abono; se pagan de forma completa (supuesto). |

## 4.4 Comisiones de entrenadores

En los planes Personalizado y Semipersonalizado, el pago se divide automáticamente entre el entrenador asignado y el negocio ($100.000/$100.000 y $75.000/$75.000, respectivamente). Este registro debe reflejarse en el módulo de Entrenadores para llevar el control de pagos por entrenador.

## 4.5 Retiro de clientes

El cliente puede retirarse del gimnasio sin necesidad de indicar un motivo.

# 5. Requisitos no funcionales

| ID | Descripción del requisito |
| --- | --- |
| RNF-01 | Plataforma: el sistema debe ser una aplicación web, accesible desde navegador, sin necesidad de instalación local. |
| RNF-02 | Seguridad: las contraseñas de los usuarios del sistema deben almacenarse cifradas; toda acción requiere autenticación previa. |
| RNF-03 | Control de acceso: cada módulo debe validar el rol del usuario autenticado antes de permitir la acción, conforme a la matriz de permisos (numeral 2.2). |
| RNF-04 | Alcance operativo: el sistema debe soportar una única sede del gimnasio. |
| RNF-05 | Disponibilidad: el sistema debe estar disponible durante el horario de atención del gimnasio, con mínima interrupción. |
| RNF-06 | Usabilidad: la interfaz debe ser simple e intuitiva, apta para personal sin formación técnica avanzada (rol Recepcionista). |
| RNF-07 | Integridad de datos: los cálculos financieros (saldos, abonos, balances) deben ser consistentes, trazables y no editables retroactivamente sin dejar registro. |
| RNF-08 | Escalabilidad: el diseño de la base de datos de clientes debe permitir incorporar en una fase futura el módulo de huella digital sin requerir un rediseño estructural. |

# 6. Modelo de datos preliminar

A continuación se listan las entidades principales identificadas y sus atributos clave, como insumo para el diseño de la base de datos.

| Entidad | Atributos principales |
| --- | --- |
| Cliente | ID, nombre completo, documento de identidad, teléfono, correo, contacto de emergencia, tipo de sangre, cumpleaños, condición médica, forma de pago, tipo de membresía, fecha de ingreso, fecha de vencimiento, estado (activo/inactivo/en mora), entrenador asignado (si aplica), grupo promocional (si aplica), comentarios/novedades. |
| Tipo de membresía | ID, nombre, valor, condiciones/vigencia, abono mínimo, es_promocional. |
| Pago / Abono | ID, cliente, tipo de membresía, fecha, valor pagado, tipo de abono (1er/2do/final/completo), saldo pendiente, forma de pago, usuario que registró. |
| Entrenador | ID, nombre, documento, teléfono, fecha de contratación, sueldo, historial de comisiones. |
| Egreso | ID, categoría, concepto/justificación, valor, fecha, usuario que registró. |
| Categoría de egreso | ID, nombre, estado (activa/inactiva). |
| Ítem de inventario | ID, nombre, cantidad, unidad de medida, stock mínimo. |
| Usuario del sistema | ID, nombre, rol (administrador/recepcionista), usuario, contraseña (cifrada), estado. |
| Asistencia (Fase 2) | ID, cliente, fecha, hora de ingreso, hora de salida. |
| Auditoría [PROPUESTA] | ID, usuario, acción, módulo, fecha/hora, detalle. |

# 7. Casos de uso principales

## 7.1 Recepcionista

Registrar cliente nuevo.

Registrar pago o abono de membresía.

Solicitar actualización de datos.

Registrar asistencia de un cliente.

Consultar y diligenciar el apartado diario.

Retirar (dar de baja) a un cliente.

## 7.2 Administrador

Incluye todos los casos de uso del Recepcionista, además de:

Crear, editar y eliminar tipos de membresía.

Registrar y gestionar entrenadores y sus comisiones.

Registrar egresos y gestionar categorías de egreso.

Gestionar el inventario del gimnasio.

Consultar finanzas, balances y reportes consolidados.

Consultar el panel de indicadores (dashboard) [PROPUESTA].

# 8. Supuestos y temas pendientes de definición

Los siguientes puntos se asumieron razonablemente para poder completar esta especificación, pero conviene validarlos con el cliente antes de iniciar el desarrollo:

Alcance exacto del módulo de Inventario: qué ítems se controlarán (equipos, insumos de aseo, suplementos, etc.) y con qué nivel de detalle.

Criterio de "disponibilidad" de los entrenadores para la asignación de clientes (cupo máximo, franjas horarias, etc.).

Confirmación de que Quincena, Semana, Día y las promociones se pagan siempre de forma completa (sin abono). – Promociones se pagan completas

Reglas exactas para el paso automático de un cliente a estado "En mora" (por ejemplo, si existe un día de gracia).

Necesidad futura de facturación electrónica o integración con medios de pago en línea (fuera de alcance en esta versión).

# 9. Anexo — Funcionalidades propuestas

Estas funcionalidades no fueron solicitadas en el levantamiento original de información, pero se sugieren como mejoras de valor para el sistema. Quedan sujetas a aprobación y priorización por parte del cliente.

| ID | Funcionalidad propuesta |
| --- | --- |
| RF-03 | Registro de auditoría de acciones de los usuarios del sistema. |
| RF-10 | Notificación automática de próximo vencimiento de membresía. |
| RF-11 | Felicitación automática de cumpleaños a clientes. |
| RF-30 | Alerta de inventario por debajo del mínimo definido. |
| RF-35 | Panel (dashboard) con indicadores clave del negocio. |
| RF-38 | Historial de asistencia por cliente. |
| RF-39 | Alertas de mantenimiento preventivo de máquinas. |
| RF-40 | Copias de seguridad automáticas y periódicas. |
