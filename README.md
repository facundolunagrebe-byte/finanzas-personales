# Mis activos

Mini app para registrar mis activos (acciones, CEDEARs, bonos, FCI, cripto, efectivo). Vite + Supabase.

## Puesta en marcha

1. En Supabase > SQL Editor, pegar y correr `supabase/schema.sql` (crea la tabla `activos` con RLS).
2. Copiar `.env.example` a `.env` y completar URL y publishable key (Project Settings > API).
3. `npm install` y `npm run dev`.

## Seguridad

- Solo se usa la publishable key; nunca la `service_role`.
- Login con email y contraseña, y passkey / Face ID (beta de Supabase). RLS: cada usuario solo ve y modifica sus propias filas; sin login no se accede a nada.
- Desactivar "Allow new users to sign up" en Supabase (Authentication > Sign In / Providers): la app es de un solo usuario.
- El Relying Party ID de la passkey debe ser el dominio definitivo de la app: cambiarlo invalida las passkeys ya registradas.
- `.env` está en `.gitignore`.