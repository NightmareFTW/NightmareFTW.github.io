/* Full clothing catalogue → data/dreamlight-valley/clothing.json.
   Lazy-loaded by the Items Database's Clothing tab. See ddv-catalogue.js. */
const path = require("path");
const { buildCatalogue } = require("./ddv-catalogue");

buildCatalogue({
  src: "https://dreamlightvalleywiki.com/Clothing",
  out: path.join(__dirname, "..", "data", "dreamlight-valley", "clothing.json"),
  label: "clothing",
}).catch((e) => { console.error(e); process.exit(1); });
