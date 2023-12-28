import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json"; // Node 14 & 16
import commonjs from '@rollup/plugin-commonjs'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue(), crx({ manifest }), ,],

	build: {
		rollupOptions: {
			input: {
				offscreen: "offscreen.html",
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
