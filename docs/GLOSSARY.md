# Domain glossary (ES → EN)

The SRS ("ERS GK") is written in Spanish. The code is written in English.
This file is the **single authoritative translation**. Before naming any new
type, field or function, look it up here. If a term is missing, add it here
first, then use it.

Rationale: without a fixed glossary, eight modules would independently invent
`installment`, `partialPayment` and `deposit` for the same concept.

## Core entities

| Spanish (SRS)       | English (code)    | Notes                                                                     |
| ------------------- | ----------------- | ------------------------------------------------------------------------- |
| Cliente             | `Client`          | Kept as "client", not "member", to map 1:1 onto the SRS                   |
| Tipo de membresía   | `MembershipType`  | The catalogue entry (name, price, term)                                   |
| Membresía           | `Membership`      | A client's actual subscription instance                                   |
| Pago                | `Payment`         |                                                                           |
| Abono               | `Installment`     | A partial payment toward a total. **Never** `deposit` or `partialPayment` |
| Entrenador          | `Trainer`         |                                                                           |
| Egreso              | `Expense`         |                                                                           |
| Categoría de egreso | `ExpenseCategory` |                                                                           |
| Ítem de inventario  | `InventoryItem`   |                                                                           |
| Usuario del sistema | `User`            | Staff account, not a gym client                                           |
| Asistencia          | `Attendance`      | Phase 2                                                                   |
| Auditoría           | `AuditLogEntry`   |                                                                           |
| Apartado diario     | `DailyLog`        | The day's logbook                                                         |
| Novedad             | `DailyLogNote`    | An entry within the daily log                                             |

## Client state (SRS §4.2)

| Spanish  | English    |
| -------- | ---------- |
| Activo   | `active`   |
| Inactivo | `inactive` |
| En mora  | `overdue`  |

Note: "Por vencer" is **not** a state. It is a derived filter
(`expiringSoon`) computed from the expiration date.

## Membership catalogue (SRS §4.1)

| Spanish                      | English (id)       |
| ---------------------------- | ------------------ |
| Mensualidad (lunes a sábado) | `monthly`          |
| Mes 3 veces por semana       | `monthlyThreeDays` |
| Quincena                     | `fortnight`        |
| Semana                       | `week`             |
| Día                          | `day`              |
| Promo amigos/familiar        | `friendsPromo`     |
| Promo folleto físico         | `flyerPromo`       |
| Personalizado                | `personalTraining` |
| Semipersonalizado            | `semiPersonal`     |

## Fields and concepts

| Spanish                 | English                      |
| ----------------------- | ---------------------------- |
| Documento de identidad  | `idNumber`                   |
| Teléfono                | `phone`                      |
| Correo electrónico      | `email`                      |
| Contacto de emergencia  | `emergencyContact`           |
| Tipo de sangre          | `bloodType`                  |
| Fecha de cumpleaños     | `birthDate`                  |
| Condición médica        | `medicalCondition`           |
| Forma de pago           | `paymentMethod`              |
| Fecha de ingreso        | `startDate`                  |
| Fecha de vencimiento    | `expirationDate`             |
| Saldo pendiente         | `outstandingBalance`         |
| Abono mínimo            | `minimumInstallment`         |
| 1er / 2do / final       | `first` / `second` / `final` |
| Comisión                | `commission`                 |
| Sueldo                  | `salary`                     |
| Vigencia                | `term`                       |
| Sede                    | `branch`                     |
| Comentarios / novedades | `notes`                      |

## Roles (SRS §2.2)

| Spanish       | English        |
| ------------- | -------------- |
| Administrador | `admin`        |
| Recepcionista | `receptionist` |

## Trainers, expenses and inventory

| Spanish               | English           |
| --------------------- | ----------------- |
| Entrenador            | `Trainer`         |
| Certificados          | `certifications`  |
| Fecha de contratación | `hiredOn`         |
| Cupo máximo           | `maxClients`      |
| Comisión              | `Commission`      |
| Egreso                | `Expense`         |
| Categoría de egreso   | `ExpenseCategory` |
| Concepto              | `description`     |
| Producto / Ítem       | `InventoryItem`   |
| Unidad de medida      | `UnitOfMeasure`   |
| Stock / Existencias   | `stock`           |
| Stock mínimo          | `minimumStock`    |
| Precio de compra      | `costPrice`       |
| Precio de venta       | `salePrice`       |
| Proveedor             | `supplier`        |

## Finance

| Spanish              | English          |
| -------------------- | ---------------- |
| Balance              | `Balance`        |
| Ingresos             | `income`         |
| Egresos (total)      | `expenses`       |
| Utilidad             | `profit`         |
| Cierre mensual       | `MonthlyClosure` |
| Ciclo (de pago)      | `cycle`          |
| Referencia           | `reference`      |
| Usuario que registró | `recordedBy`     |
| Apartado diario      | `DailyLog`       |
| Novedad              | `DailyLogNote`   |
