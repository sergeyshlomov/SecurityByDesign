import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ base: './', plugins: [react(), {
  name:'development-mail-config',
  configureServer(server) {
    // Default development uses the same configured provider as the static site.
    // Opt into the retained Node/Worker backend explicitly when developing it.
    if(process.env.CONTACT_PROVIDER!=='worker')return;
    server.middlewares.use((req,res,next)=>{
      if(req.url?.split('?')[0]!=='/site-config.json')return next();
      res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({contactEndpoint:'/api/contact'}));
    });
  }
}], server:{ proxy:{ '/api':'http://127.0.0.1:8787' } } });
