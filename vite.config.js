import { defineConfig, loadEnv } from 'vite';
import { createHandler } from './api/tour.js';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'');
 const handler=createHandler({getKey:()=>env.TOUR_API_KEY||process.env.TOUR_API_KEY});
 const proxy=server=>{server.middlewares.use('/api/tour',(req,res)=>handler(req,res));};
 return {plugins:[{name:'tour-server',configureServer:proxy,configurePreviewServer:proxy}]};
});
