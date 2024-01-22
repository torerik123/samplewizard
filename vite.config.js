import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { crx } from "@crxjs/vite-plugin"
import manifest from "./manifest.json"
import commonjs from '@rollup/plugin-commonjs'
import mergePermissions from "./mergePermissions"

// import { resolve } from 'path';

export default defineConfig({
	plugins: [vue(), crx({ manifest })],
	build: {
		rollupOptions: {
			input: "Extpay.js",
			output: {
				dir: 'output',
				format: 'cjs'
			},
			plugins: [
				commonjs({strictRequires: true, }), 
				mergePermissions({ permissions: ["offscreen"] }) 
			],
		},
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


