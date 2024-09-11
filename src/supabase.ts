import { createClient } from "@supabase/supabase-js"

// Types 
import { Database } from "./types/supabasetypes"

export const supabase = createClient<Database>(
	'https://pysnzshgeafotwtersgp.supabase.co', 
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c256c2hnZWFmb3R3dGVyc2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUzNjIyMDAsImV4cCI6MjA0MDkzODIwMH0.admFCKfM7V3kdwPbnA_3pONoX9hs_eRvuQubrYOfN0Q' 
)