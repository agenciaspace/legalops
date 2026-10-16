import {defineConfig} from '@playwright/test'
export default defineConfig({
 testDir:'./e2e',testMatch:/chat\.spec\.ts/,fullyParallel:false,workers:1,retries:0,timeout:180_000,
 use:{baseURL:process.env.CHAT_BASE_URL||'http://127.0.0.1:3138',locale:'pt-BR',trace:'retain-on-failure'},
 projects:[{name:'chromium',use:{browserName:'chromium'}}],
 webServer:process.env.CHAT_BASE_URL?undefined:{command:'LEGALOPS_NEXT_DIST_DIR=.next-chat-dev npm run dev -- --hostname 127.0.0.1 --port 3138',url:'http://127.0.0.1:3138/chat',reuseExistingServer:!process.env.CI,timeout:120_000},
})
