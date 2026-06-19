import { createClient } from '@supabase/supabase-js';

// Las llaves de Supabase (URL y ANON KEY) son públicas por diseño.
// Al ponerlas directamente aquí, evitamos los problemas de inyección de variables 
// en el Docker de Railway durante el proceso de Build de Vite.
const supabaseUrl = 'https://xlqdteghltctdorrpfdo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscWR0ZWdobHRjdGRvcnJwZmRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTcwNDQsImV4cCI6MjA5NzM5MzA0NH0.IkHt8Kp2n12ctqlG74Azu4iHY08pWzcYbYeG0NZz1no';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
