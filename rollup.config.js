import commonjs from '@rollup/plugin-commonjs'
import mergePermissions from "./mergePermissions"
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
	rollupOptions: {
		input: {
			main: "src/main.js",
			offscreen: "offscreen.html"
		},
		output: {
			dir: "output",
			format: "cjs",
		},
		plugins: [
			nodeResolve(),
			commonjs(),
			mergePermissions({ permissions: ["offscreen"] }),
		],
	},
};
