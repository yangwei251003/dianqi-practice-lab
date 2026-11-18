import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {readFileSync} from 'node:fs'

export default defineConfig({base:'./',plugins:[react(),{name:'retain-distribution-notices',generateBundle(){
  const packages=['react','react-dom','scheduler','three','lucide-react']
  const notices=packages.map(name=>name+'\n\n'+readFileSync('node_modules/'+name+'/LICENSE','utf8')).join('\n\n----------------\n\n')
  this.emitFile({type:'asset',fileName:'THIRD-PARTY-NOTICES.txt',source:notices})
}}],build:{chunkSizeWarningLimit:800}})
