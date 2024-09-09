import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const SECRET_KEY = Deno.env.get("JWT_SECRET");

export const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    console.log("REQUEST", req);

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
        const text = await req.text(); // Read raw text
        console.log("Raw request body:", text); // Log raw text
        const body = JSON.parse(text); // Parse text to JSON
        console.log("Parsed request body:", body); // Log parsed body

        const { email } = body;

        if (!email) {
            return new Response("Email is required", { status: 400 });
        }

        const payload = {
            iss: "SampleWizard",
            sub: email,
            exp: getNumericDate(60 * 60),
        };

		
		// const jwt = await create(
		// 	{ alg: "HS512", typ: "JWT" }, 
		// 	payload, 
		// 	{ key: SECRET_KEY });
	
		// TODO => DELETE 
		const jwt = await create({ alg: "HS512", typ: "JWT" }, { foo: "bar" }, "123");


        return new Response(JSON.stringify({ token: jwt }), {
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