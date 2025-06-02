-- Admin paskyros sukūrimas Supabase platformoje
-- Šį SQL kodą reikia vykdyti Supabase SQL redaktoriuje (https://app.supabase.com/)

-- SVARBU: Šis kodas turi būti vykdomas su administratoriaus teisėmis Supabase Dashboard aplinkoje
-- arba per Service Role API raktą, nes paprastas vartotojas negali tiesiogiai keisti auth.users lentelės

------------------------------------------------------------------
-- 1 BŪDAS: Per Dashboard (REKOMENDUOJAMA - VEIKIA VISADA)
------------------------------------------------------------------
-- 1. Prisijunkite prie Supabase Dashboard (https://app.supabase.com/)
-- 2. Pasirinkite savo projektą
-- 3. Eikite į Authentication -> Users -> "Invite user" arba "Add User"
-- 4. Įveskite šiuos duomenis:
--    - Email: edvinassaulenas1@gmail.com
--    - Password: rasimundas5556
-- 5. Po to vykdykite tik profilio kūrimo/atnaujinimo dalį (žemiau)

-- Po vartotojo sukūrimo per dashboard, rankiniu būdu sutvarkykite jo profilį:
DO $$
DECLARE
    admin_email TEXT := 'edvinassaulenas1@gmail.com';
    admin_id UUID;
BEGIN
    -- Gauname vartotojo ID
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
    
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Vartotojas su el. paštu % nerastas. Pirmiausia sukurkite vartotoją per Supabase Dashboard.', admin_email;
    END IF;
    
    -- Atnaujinti/sukurti profilį
    -- Pastaba: id laukas yra pagrindinis raktas, kuris nurodo į auth.users(id)
    INSERT INTO public.profiles (
        id,
        full_name,
        username,
        email,
        bio,
        school,
        role,
        grade_level,
        gpa,
        updated_at,
        created_at
    ) VALUES (
        admin_id,                        -- id laukas, kuris yra FK į auth.users(id)
        'Administratorius',              -- pilnas vardas
        'admin',                         -- vartotojo vardas
        admin_email,                     -- el. paštas
        'Sistemos administratorius',     -- bio
        'EduTrack',                      -- mokykla
        'admin',                         -- rolė (administratorius)
        'Admin',                         -- klasės lygis
        10.0,                            -- vidurkis
        now(),                           -- atnaujinimo data
        now()                            -- sukūrimo data
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = 'Administratorius',
        username = CASE 
                    WHEN profiles.username = 'admin' THEN profiles.username
                    ELSE 'admin'
                   END,
        role = 'admin',
        updated_at = now();
    
    RAISE NOTICE 'Profilis sukurtas/atnaujintas sėkmingai. Admin ID: %', admin_id;
END $$;

-- Patikrinkite, ar sėkmingai sukūrėte admin vartotoją
SELECT id, email, role FROM public.profiles WHERE role = 'admin';

------------------------------------------------------------------
-- Papildoma informacija ir alternatyvūs metodai
------------------------------------------------------------------

-- PASTABA: profiles lentelėje nėra atskiro "user_id" stulpelio.
-- Vietoj to, "id" stulpelis yra ir pagrindinis raktas, ir išorinis raktas į auth.users(id).

-- Jei turite administratoriaus teises ir norite įdiegti plėtinį:
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alternatyvus vartotojo sukūrimo metodas per Supabase API
-- (vykdykite kodą už Supabase ribų, pvz., naudojant Node.js):
/*
const { createClient } = require('@supabase/supabase-js')

// Naudokite service_role (admin) raktą
const supabase = createClient(
  'https://jūsų-projektas.supabase.co',
  'jūsų-service-role-raktas'
)

async function createAdminUser() {
  // 1. Sukurti vartotoją
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'edvinassaulenas1@gmail.com',
    password: 'rasimundas5556',
    email_confirm: true
  })
  
  if (error) {
    console.error('Klaida kuriant vartotoją:', error)
    return
  }
  
  // 2. Gauti vartotojo ID
  const userId = data.user.id
  
  // 3. Sukurti/atnaujinti profilį
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: 'Administratorius',
      username: 'admin',
      email: 'edvinassaulenas1@gmail.com',
      bio: 'Sistemos administratorius',
      school: 'EduTrack',
      role: 'admin',
      grade_level: 'Admin',
      gpa: 10.0,
      updated_at: new Date(),
      created_at: new Date()
    })
  
  if (profileError) {
    console.error('Klaida kuriant profilį:', profileError)
    return
  }
  
  console.log('Admin vartotojas sukurtas sėkmingai. ID:', userId)
}

createAdminUser()
*/ 