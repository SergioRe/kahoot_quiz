# Pruebas manuales de seguridad (inyección y validación)

Esta guía valida los refuerzos aplicados en:

- `src/pages/HomePage.tsx` (sanitización y límites de entrada)
- `src/components/AdminUsersDataTable.tsx` (protección de CSV injection)
- `firestore.rules` (validación estricta por esquema/rol)

## 1) Preparación rápida

1. Levanta la app:

```bash
npm run dev
```

2. (Opcional recomendado) Levanta emuladores para probar reglas sin tocar producción:

```bash
npx firebase emulators:start --only firestore,auth
```

3. Asegúrate de haber desplegado reglas si vas contra proyecto real:

```bash
firebase deploy --only firestore:rules
```

## 2) Pruebas de UI (insertar/editar/agregar)

## Perfil

- En `Editar datos del perfil`, intenta guardar:
  - Nombre vacío o solo espacios.
  - Nombre con HTML: `<script>alert(1)</script>`.
  - Nombre muy largo (> 80 chars).
- Resultado esperado:
  - Rechaza vacío.
  - No guarda etiquetas `<` `>`.
  - Trunca/normaliza longitud y espacios.

## Exámenes

- En crear/editar examen intenta:
  - Título vacío.
  - Título/Descripción con HTML (`<img ...>`).
  - Preguntas sin texto.
  - Respuestas vacías.
  - `correctaIndex` inválido (forzando desde DevTools si quieres).
- Resultado esperado:
  - Mensajes de validación.
  - No guarda texto peligroso tal cual.
  - No permite estados inconsistentes.

## 3) Pruebas de reglas Firestore

## Usuario normal (owner)

- Puede leer/editar su propio documento en `usuarios/{uid}`.
- No puede cambiar su `rol` ni `activo`.
- No puede listar todos los usuarios.

## Admin

- Puede listar usuarios.
- Puede editar `rol` y `activo`.

## Exámenes

- Usuario normal:
  - Puede crear examen propio.
  - Puede editar/eliminar solo si `creadoPorUid` es suyo.
- Admin:
  - Puede editar/eliminar cualquiera.

## Estructura inválida

Intenta enviar documentos con:

- Campos extra no permitidos.
- Tipos incorrectos (`totalPreguntas` string, etc.).
- Longitudes fuera de límite.

Resultado esperado: reglas deniegan (`PERMISSION_DENIED`).

## 4) Prueba anti CSV injection

1. Crea/edita un usuario (o nombre) con valor que inicie en fórmula, por ejemplo:

- `=2+2`
- `+SUM(A1:A2)`
- `-cmd|...`
- `@HYPERLINK(...)`

2. Exporta CSV desde el dashboard.
3. Abre el CSV en Excel/Sheets.

Resultado esperado:

- El valor viene prefijado con `'`.
- No se ejecuta como fórmula.

## 5) Checklist de aprobación

- [ ] No se puede guardar perfil inválido.
- [ ] No se puede guardar examen/preguntas inválidas.
- [ ] Reglas bloquean tipos/campos no permitidos.
- [ ] Owner no eleva privilegios.
- [ ] CSV exportado no ejecuta fórmulas.
