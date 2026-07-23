const esbuild = require('esbuild');
const { execSync, spawn } = require('child_process');
const fs = require('fs');

const isWatch = process.argv.includes('--watch');

async function main() {
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dubai Electronics Stock Manager</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body class="bg-gray-50 text-gray-900 font-sans overflow-hidden select-none">
    <div id="root"></div>
    <script src="bundle.js"></script>
  </body>
</html>`;

  fs.writeFileSync('dist/index.html', htmlContent);

  console.log('Building CSS with Tailwind...');
  execSync('npx tailwindcss -i ./src/index.css -o ./dist/styles.css', { stdio: 'inherit' });

  if (isWatch) {
    console.log('⚡ Starting real-time watch mode...');

    // Run Tailwind in watch mode in background
    const tailwindProcess = spawn('npx', ['tailwindcss', '-i', './src/index.css', '-o', './dist/styles.css', '--watch'], {
      shell: true,
      stdio: 'ignore'
    });

    // Run esbuild in watch context mode for instant 10ms re-bundling
    const ctx = await esbuild.context({
      entryPoints: ['src/main.jsx'],
      bundle: true,
      outfile: 'dist/bundle.js',
      loader: { '.jsx': 'jsx', '.js': 'js', '.svg': 'dataurl', '.png': 'dataurl' },
      define: { 'process.env.NODE_ENV': '"development"' },
      sourcemap: true,
    });

    await ctx.rebuild();
    await ctx.watch();

    console.log('🚀 Launching Electron application...');
    const electronProcess = spawn('npx', ['electron', '.'], {
      shell: true,
      stdio: 'inherit'
    });

    electronProcess.on('close', () => {
      ctx.dispose();
      try { tailwindProcess.kill(); } catch (e) {}
      process.exit(0);
    });

  } else {
    console.log('Bundling JavaScript with esbuild...');
    await esbuild.build({
      entryPoints: ['src/main.jsx'],
      bundle: true,
      outfile: 'dist/bundle.js',
      loader: { '.jsx': 'jsx', '.js': 'js', '.svg': 'dataurl', '.png': 'dataurl' },
      define: { 'process.env.NODE_ENV': '"production"' },
      minify: true,
      sourcemap: false,
    });
    console.log('Build complete in dist/');
  }
}

main().catch((err) => {
  console.error('Build error:', err);
  process.exit(1);
});
