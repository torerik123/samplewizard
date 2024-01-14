import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { crx } from "@crxjs/vite-plugin"
import manifest from "./manifest.json" // Node 14 & 16
import commonjs from '@rollup/plugin-commonjs'
import mergePermissions from "./mergePermissions"

export default defineConfig({
	plugins: [vue(), crx({ manifest }), ,],

	build: {
		rollupOptions: {
			input: {
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
		port: 5173,
		strictPort: true,
		hmr: {
			port: 5173,
		},
	},
});


