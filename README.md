# PFA Dashboard – Aplicație de administrare pentru un PFA din IT

Aplicație web completă pentru administrarea unui PFA (neplătitor de TVA) din domeniul IT, cu autentificare reală prin Supabase Auth, securitate avansată prin Row Level Security (RLS), stocare privată și multiple module de gestionare.

## Cuprins
1. [Descriere generală](#descriere-generală)
2. [Configurare Supabase](#configurare-supabase)
   - [Creare proiect](#creare-proiect)
   - [Rulare migrări SQL](#rulare-migrări-sql)
   - [Activare Auth](#activare-auth)
   - [Obținere chei API](#obținere-chei-api)
   - [Configurare Storage](#configurare-storage)
   - [Restricționare origini](#restricționare-origini)
3. [Configurare fișier `js/config-fiscal.js`](#configurare-fișier-jsconfig-fiscaljs)
4. [Utilizarea aplicației](#utilizarea-aplicației)
   - [Autentificare](#autentificare)
   - [Dashboard](#dashboard)
   - [Facturi emise](#facturi-emise)
   - [Cheltuieli](#cheltuieli)
   - [Registru fiscal](#registru-fiscal)
   - [Extrase de cont](#extrase-de-cont)
   - [Contracte](#contracte)
   - [Declarația unică](#declarația-unică)
   - [Arhivă documente](#arhivă-documente)
   - [Secretariat](#secretariat)
   - [e-Factura](#e-factura)
5. [Backup și Restore](#backup-și-restore)
6. [Limitări și avertismente](#limitări-și-avertismente)
7. [Recomandări operaționale](#recomandări-operaționale)
8. [Testare](#testare)

## Descriere generală
Această aplicație este destinată unui PFA neplătitor de TVA, oferind suport pentru:
- Facturi standard (cod 380), storno și note de credit (cod 381)
- Mențiunea legală pe factură: „TVA neexigibil conform art. 399 alin. (1) din Codul fiscal” (configurabil)
- Calcul fiscal pentru Declarația unică (impozit, CAS, CASS) cu valori configurabile
- Generare XML e-Factura conform CIUS-RO 1.0.0 (best-effort)
- Evidență completă a documentelor, contractelor, cheltuielilor și extraselor bancare

Toate datele sunt stocate în Supabase (PostgreSQL) și protejate prin RLS – fiecare utilizator vede doar propriile rânduri.

## Configurare Supabase

### Creare proiect
1. Accesează [supabase.com](https://supabase.com) și creează un cont.
2. Click pe **New project**.
3. Alege un nume (ex: `pfa-dashboard`), o parolă puternică pentru baza de date și o regiune apropiată (ex: `eu-central-1`).
4. Așteaptă finalizarea inițializării.

### Rulare migrări SQL
1. Deschide **SQL Editor** în dashboard-ul Supabase.
2. Rulează, în ordine, conținutul fișierelor:
   - `migrations/001_init.sql` (creează schema, tabele, secvențe, trigger-e, RLS)
   - `migrations/002_audit.sql` (adaugă tabelul de audit și trigger-ele)
   - `storage-policies.sql` (creează bucket-ul privat și politicile de acces)
3. Verifică să nu existe erori în rezultatul rulării.

### Activare Auth
- Mergi la **Authentication → Providers** și asigură-te că **Email** este activat.
- Opțional: dezactivează confirmarea emailului pentru testare (**Authentication → Providers → Email → Confirm email = OFF**).
- Creează utilizatori din **Authentication → Users → Add user** sau prin SQL:
  ```sql
  select auth.create_user('email@exemplu.ro', 'parola_puternica', true);