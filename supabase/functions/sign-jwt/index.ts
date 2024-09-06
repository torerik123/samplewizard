// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { serve } from "https://deno.land/x/sift@0.4.3/mod.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.7/mod.ts";

const SECRET_KEY = Deno.env.get("JWT_SECRET");

serve(async (req: Request) => {
	if (req.method === "OPTIONS") {
		return new Response("OK", {
			headers: {
				"Access-Control-Allow-Origin": "*", // Allow any origin, or restrict to your domain
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		});
	}

	if (req.method !== "POST") {
		return new Response("Method not allowed", { status: 405 });
	}

	const body = await req.json();
	const { email } = body;

	if (!email) {
		return new Response("Email is required", { status: 400 });
	}

	// JWT token payload
	const payload = {
		iss: "SampleWizard", // Issuer
		sub: email, // Subject (user's email)
		exp: getNumericDate(60 * 60), // Expires in 1 hour
	};

	// Sign the JWT token
	const jwt = await create({ alg: "HS256", typ: "JWT" }, payload, SECRET_KEY);

	return new Response(JSON.stringify({ token: jwt }), {
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*", // Allow any origin, or restrict to your domain
		},
	});
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/sign-jwt' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
