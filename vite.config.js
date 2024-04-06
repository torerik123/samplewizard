import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { crx } from "@crxjs/vite-plugin"
import manifest from "./manifest.json"

export default defineConfig({
	test: {
		globals: true,
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


