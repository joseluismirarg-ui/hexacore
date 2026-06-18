-- ==============================================================================
-- MIGRACIÓN PERSONALIZADA: SUPABASE AUTH & RLS (Alineado con Prisma TEXT/CUID)
-- ==============================================================================

-- ----------------------------------------------------------------------------
-- 0. COMPATIBILIDAD DE ENTORNO LOCAL (DOCKER POSTGRES ESTÁNDAR)
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY,
    email VARCHAR(255),
    raw_user_meta_data JSONB
);

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb AS $$
    SELECT '{}'::jsonb;
$$ LANGUAGE sql STABLE;

-- ----------------------------------------------------------------------------
-- 1. TRIGGER DE AUTOMATIZACIÓN DE PERFILES
-- ----------------------------------------------------------------------------

-- Función que captura el evento de registro de Supabase Auth
-- Usa SECURITY DEFINER para insertar en public.users
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, tenant_id, email, name, role, is_active)
    VALUES (
        NEW.id::text, -- Casteo a TEXT para compatibilidad con Prisma
        COALESCE(NEW.raw_user_meta_data ->> 'tenant_id', 'default-tenant'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'name', 'Nuevo Usuario'),
        COALESCE(NEW.raw_user_meta_data ->> 'role', 'VENDEDOR')::"Role", -- Casteo al Enum de Prisma
        true
    );
    RETURN NEW;
END;
$$;

-- Asociar el trigger a la tabla del sistema auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


-- ----------------------------------------------------------------------------
-- 2. POLÍTICAS DE RLS BASADAS EN JWT (Tabla: items)
-- ----------------------------------------------------------------------------

-- Activación obligatoria de seguridad a nivel de fila
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Política SELECT (Read): Bypass total si es ADMIN o filtro por tenant_id
CREATE POLICY "Items_SELECT_Tenant_Isolation" ON public.items
    FOR SELECT USING (
        tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::text
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
    );

-- Política INSERT (Create)
CREATE POLICY "Items_INSERT_Tenant_Isolation" ON public.items
    FOR INSERT WITH CHECK (
        tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::text
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
    );

-- Política UPDATE (Update)
CREATE POLICY "Items_UPDATE_Tenant_Isolation" ON public.items
    FOR UPDATE USING (
        tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::text
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
    ) WITH CHECK (
        tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::text
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
    );

-- Política DELETE (Delete)
CREATE POLICY "Items_DELETE_Tenant_Isolation" ON public.items
    FOR DELETE USING (
        tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::text
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
    );
