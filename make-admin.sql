-- SQL skriptas administratoriaus teisėms suteikti
-- Vykdykite Supabase SQL redaktoriuje

-- Atnaujinti vartotojo profilį profiles lentelėje
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'edvinassaulenas1@gmail.com';

-- Patikrinti, ar atnaujinimas pavyko
SELECT id, email, role FROM public.profiles 
WHERE email = 'edvinassaulenas1@gmail.com'; 