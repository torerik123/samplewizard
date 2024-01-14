
import { readFile, writeFile } from 'fs/promises';

// Fix issue with bundling offscreen.html for build 
const mergePermissions = (options = {}) => {
    const { src = 'dist/manifest.json', dest = 'dist/manifest.json', permissions = [] } = options
    const hook = 'writeBundle'
    return {
        name: 'merge-permissions',
        [hook]: async () => {
            if (permissions.length > 0) {
                let manifest = await readFile(src, 'utf8')
                manifest = JSON.parse(manifest)
                manifest['permissions'] = manifest['permissions'].concat(permissions)
                await writeFile(dest, JSON.stringify(manifest, null, 3))
            }
        }
    }
}

export default mergePermissions;