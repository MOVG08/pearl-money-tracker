## Plan de corrección

### 1. Arreglar el error de la columna `name` en movimientos

Agregar una migración de base de datos para que la tabla `transactions` tenga la columna que ya usa la app:

```sql
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS name TEXT;
```

Esto resolverá el error al agregar un movimiento cuando Supabase dice que no encuentra la columna `name`.

### 2. Revisar el guardado de gastos hechos con tarjeta

Ajustar el flujo de creación de movimientos para confirmar que, cuando se selecciona una tarjeta como “Cuenta origen”:

- El movimiento se guarda con `credit_account_id` de la tarjeta.
- `account_id` queda en `null`.
- El movimiento cuenta como gasto real de tarjeta.
- No se confunde con un pago de tarjeta/deuda.

### 3. Corregir el progreso hacia el gasto mínimo

Actualizar la lógica de `getCreditAccountBalance` para que el progreso de gasto mínimo incluya correctamente los gastos hechos con tarjeta dentro del ciclo actual.

También reforzaré el cálculo para evitar errores de fechas en ciclos de corte, especialmente cuando el día de corte cae al final del mes.

### 4. Mostrar el progreso actualizado en ambas vistas

Verificar que el mismo cálculo se refleje en:

- Lista de cuentas/créditos (`AccountsPage`).
- Detalle de tarjeta (`CreditAccountDetailPage`).

### 5. Validación final

Después de implementar:

- Probar que se puede crear un movimiento con nombre.
- Probar que un gasto cargado a tarjeta incrementa el progreso del gasto mínimo.
- Probar que un pago de tarjeta no incrementa ese progreso.

## Archivos esperados

- Nueva migración Supabase para `transactions.name`.
- `src/contexts/DataContext.tsx`, si hace falta robustecer el cálculo del ciclo.
- `src/components/TransactionForm.tsx`, si hace falta ajustar el payload de movimientos con tarjeta.