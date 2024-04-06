/// <reference types="vitest" />
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { crx } from "@crxjs/vite-plugin"
import manifest from "./manifest.json"

export default defineConfig({
	test: {
		environment: "happy-dom",
		globals: true,
		coverage: {
			provider: 'v8'
		},
		css: true,
	},
	plugins: [vue(), crx({ manifest })],
	build: {
		modulePreload: false,
	},
	server: {
		host:"localhost",
		port: 3000,
		strictPort: true,
		hmr: {
			port: 3000,
		},
	},
	preview: {
		port: 8000,
		strictPort: true,
	},
});


