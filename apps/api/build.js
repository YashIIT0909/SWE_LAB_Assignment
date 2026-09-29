import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/serverless.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: 'api/index.js',
  external: [
    'express',
    'cors',
    'bcryptjs',
    'jsonwebtoken',
    '@prisma/client',
    '@prisma/adapter-pg',
    'pg',
    'dotenv',
  ],
})

console.log('Successfully bundled serverless handler to api/index.js')
