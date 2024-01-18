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
			input: {

				// WORKS WITHOUT THIS PART
				// popup: resolve(__dirname, "index.html"),
				// offscreen: "offscreen.html",
				// type: "module",
			},
			output: {
				dir: 'output',
				format: 'cjs'
			},
			plugins: [commonjs(), mergePermissions({ permissions: ["offscreen"] }) ],
		},
		modulePreload: false,
	},
	server: {
		port: 3000,
		strictPort: true,
		hmr: {
			port: 3000,
		},
	},
});


