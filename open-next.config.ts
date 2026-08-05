// open-next.config.ts - Cloudflare Workers adapter config for GhostWriter
//
// No incremental cache override: every route is `force-dynamic` (see
// src/app/layout.tsx), so there's nothing for Next's ISR/data cache to
// ever store - an R2 cache bucket here would sit permanently empty.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
