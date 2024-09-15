import { createClient } from "@supabase/supabase-js"

// Types 
import { Database } from "../src/types/supabasetypes"

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c256c2hnZWFmb3R3dGVyc2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUzNjIyMDAsImV4cCI6MjA0MDkzODIwMH0.admFCKfM7V3kdwPbnA_3pONoX9hs_eRvuQubrYOfN0Q'
const supabaseUrl = 'https://pysnzshgeafotwtersgp.supabase.co'

// Pass optional custom JWT to supabase client
export const createCustomSupabaseClient = (token?: string) => {
	const headers: { [key: string]: string } = {
		apikey: supabaseKey,
	}

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	return createClient<Database>(supabaseUrl, supabaseKey, {
		global: {
			headers: headers,
		},
	})
}