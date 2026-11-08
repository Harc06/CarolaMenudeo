-- Carola Menudeo: bloquea el acceso directo con la llave anon a las tablas del PIN.
-- Sin políticas: las RPC SECURITY DEFINER siguen leyendo estas tablas.
ALTER TABLE "public"."menudeo_pin_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."menudeo_pin_sessions" ENABLE ROW LEVEL SECURITY;
