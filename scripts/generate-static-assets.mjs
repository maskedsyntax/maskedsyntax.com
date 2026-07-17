import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const siteUrl = "https://maskedsyntax.com";

const faviconSvg = readFileSync(join(__dirname, "favicon.svg"));
const markSvg = readFileSync(join(__dirname, "brand-mark.svg"));

const darkBg = { r: 11, g: 11, b: 12, alpha: 1 };

async function pngFromSvg(svg, size, bg = null) {
  const raster = sharp(svg, { density: 300 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png();

  if (!bg) return raster.toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: await raster.toBuffer(), gravity: "centre" }])
    .png()
    .toBuffer();
}

async function generateFavicons() {
  writeFileSync(join(publicDir, "favicon.svg"), faviconSvg);

  for (const size of [16, 32]) {
    await sharp(faviconSvg, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(join(publicDir, `favicon-${size}.png`));
  }

  for (const size of [180, 192, 512]) {
    const buf = await pngFromSvg(markSvg, Math.round(size * 0.62), darkBg);
    const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
    await sharp(buf).resize(size, size).toFile(join(publicDir, name));
  }

  const ogWidth = 1200;
  const ogHeight = 630;
  const logoSize = 220;
  const logo = await pngFromSvg(markSvg, logoSize, darkBg);
  await sharp({
    create: {
      width: ogWidth,
      height: ogHeight,
      channels: 4,
      background: darkBg,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(join(publicDir, "og-image.png"));

  console.log("Generated favicons and og-image.png");
}

function collectBlogSlugs(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectBlogSlugs(full, acc);
    else if (entry.name.endsWith(".md")) acc.push(entry.name.replace(/\.md$/, ""));
  }
  return acc;
}

function generateSitemap() {
  const blogDir = join(root, "blog");
  const slugs = collectBlogSlugs(blogDir);
  const today = new Date().toISOString().slice(0, 10);

  const urls = [
    { loc: `${siteUrl}/`, priority: "1.0" },
    { loc: `${siteUrl}/blog`, priority: "0.8" },
    { loc: `${siteUrl}/about`, priority: "0.6" },
    ...slugs.map((slug) => ({
      loc: `${siteUrl}/blog/${slug}`,
      priority: "0.7",
    })),
  ];

  const body = urls
    .map(
      ({ loc, priority }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`,
    )
    .join("\n");

  writeFileSync(
    join(publicDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`,
  );

  console.log(`Generated sitemap.xml (${urls.length} URLs)`);
}

function generateRobots() {
  writeFileSync(
    join(publicDir, "robots.txt"),
    `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`,
  );
  console.log("Generated robots.txt");
}

function generateManifest() {
  writeFileSync(
    join(publicDir, "site.webmanifest"),
    JSON.stringify(
      {
        name: "MaskedSyntax",
        short_name: "MaskedSyntax",
        description: "Small tools built for everyday use.",
        start_url: "/",
        display: "standalone",
        background_color: "#0b0b0c",
        theme_color: "#0b0b0c",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      null,
      2,
    ),
  );
  console.log("Generated site.webmanifest");
}

await generateFavicons();
generateSitemap();
generateRobots();
generateManifest();
