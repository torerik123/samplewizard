import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json"; // Node 14 & 16
import commonjs from '@rollup/plugin-commonjs'

export default defineConfig({
	plugins: [vue(), crx({ manifest }), ,],

	build: {
		rollupOptions: {
			input: {
				offscreen: "offscreen.html",
			},
			output: {
				dir: 'output',
				format: 'cjs'
			},
			plugins: [commonjs()],
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
