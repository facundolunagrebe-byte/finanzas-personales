# Mis activos

Mini app para registrar mis activos (acciones, CEDEARs, bonos, FCI, cripto, efectivo). Vite + Supabase.

## Puesta en marcha

1. En Supabase > SQL Editor, pegar y correr `supabase/schema.sql` (crea la tabla `activos` con RLS).
2. Copiar `.env.example` a `.env` y completar URL y publishable key (Project Settings > API).
3. `npm install` y `npm run dev`.

## Seguridad

- Solo se usa la publishable key; nunca la `service_role`.
- **Versión actual: sin login y con la tabla abierta.** Es solo para uso local. No publicar la app hasta agregar acceso con passkey / Face ID y cerrar la política `activos_abierto_temporal`.
- `.env` está en `.gitignore`.
