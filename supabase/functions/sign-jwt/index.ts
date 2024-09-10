import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createJWT } from "./jwt.js";

const SECRET_KEY = Deno.env.get("JWT_SECRET");

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
	if (!SECRET_KEY) {
		console.error("JWT_SECRET is not set");
		return new Response("Internal Server Error", { status: 500 });
	}

	// Handle CORS preflight request
	if (req.method === "OPTIONS") {
		return new Response("OK", {
			headers: {
				...corsHeaders,
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
			},
		});
	}

	if (req.method !== "POST") {
		return new Response("Method not allowed", { status: 405 });
	}

	try {
		const body = await req.json()
		const { email } = body;

		if (!email) {
			return new Response("Email is required", { status: 400 });
		}

		const payload = {
			user_email: email,
		};

		// Create the token
		const token = await createJWT(payload, SECRET_KEY);

		return new Response(JSON.stringify({ token }), {
			headers: {
				...corsHeaders,
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("Error processing request:", error);
		return new Response("Failed to create JWT", { status: 500 });
	}
});
