// Encode the JWT header and payload
export const base64UrlEncode = (str)  => {
	return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

// Function to create a JWT token using HMAC-SHA256
export const createJWT = async (payload, secret) => {
	const header = {
		alg: "HS256",
		typ: "JWT",
	};

	// Encode the header and payload as Base64Url
	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(payload));

	// Create the signing input
	const signingInput = `${encodedHeader}.${encodedPayload}`;

	// Convert secret and signing input to Uint8Array
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	);

	// Sign the input
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(signingInput)
	);

	// Encode the signature as Base64Url
	const encodedSignature = base64UrlEncode(
		String.fromCharCode(...new Uint8Array(signature))
	);

	// Return the complete JWT
	return `${signingInput}.${encodedSignature}`;
}

export const parseJwt = (token) => {
    try {
		if (!token) {
			// console.warn("Missing token")
			return 
		}

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Invalid token:', error);
        return null;
    }
}