import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/scrape-ahcab", async (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    const sendEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendEvent({ status: 'info', message: 'Fetching member list from AHCAB...' });
      const response = await fetch("https://ahcab.net/general-members");
      const html = await response.text();
      const $ = cheerio.load(html);
      const links: string[] = [];
      $('.member-name a').each((_, el) => {
        const href = $(el).attr('href');
        if (href) links.push(href);
      });

      sendEvent({ status: 'info', message: `Found ${links.length} members. Starting to scrape details...` });

      const results = [];
      // Fetch in batches of 10
      for (let i = 0; i < links.length; i += 10) {
        const batch = links.slice(i, i + 10);
        const batchPromises = batch.map(async (url) => {
          try {
            const mRes = await fetch(url);
            const mHtml = await mRes.text();
            const $m = cheerio.load(mHtml);
            const name = $m('th:contains("Member Name:")').next('td').text().trim();
            const address = $m('th:contains("Member\'s Address:")').next('td').text().trim();
            const phone = $m('th:contains("Member\'s Phone:")').next('td').text().trim();
            const email = $m('th:contains("Member\'s Email:")').next('td').text().trim();
            const ceo = $m('th:contains("CEO Name:")').next('td').text().trim();
            const businessType = $m('th:contains("Business Type:")').next('td').text().trim();
            
            return {
              name: ceo || name || 'Unknown',
              company: name || 'Unknown Company',
              email: email || 'N/A',
              phone: phone || 'N/A',
              country: 'Bangladesh',
              businessType: businessType || 'N/A',
              product: 'N/A',
              quantity: 'Bulk',
              message: `Scraped from AHCAB: ${url}. Address: ${address}`
            };
          } catch (e) {
            return null;
          }
        });
        const batchResults = (await Promise.all(batchPromises)).filter(Boolean);
        results.push(...batchResults);
        sendEvent({ status: 'progress', current: Math.min(i + 10, links.length), total: links.length });
      }
      
      sendEvent({ status: 'done', results });
    } catch (err: any) {
      sendEvent({ status: 'error', message: err.message });
    } finally {
      res.end();
    }
  });

  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // SPA fallback for development mode
    app.use("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production mode serving static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // SPA fallback for production
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
