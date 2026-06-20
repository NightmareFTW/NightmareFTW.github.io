/* Full furniture catalogue → data/dreamlight-valley/furniture.json.
   Lazy-loaded by the Items Database's Furniture tab. See ddv-catalogue.js. */
const path = require("path");
const { buildCatalogue } = require("./ddv-catalogue");

buildCatalogue({
  src: "https://dreamlightvalleywiki.com/Furniture",
  out: path.join(__dirname, "..", "data", "dreamlight-valley", "furniture.json"),
  label: "furniture",
}).catch((e) => { console.error(e); process.exit(1); });
