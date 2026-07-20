/* Full furniture catalogue → data/dreamlight-valley/furniture.json.
   Lazy-loaded by the Items Database's Furniture tab. See ddv-catalogue.js. */
const path = require("path");
const { buildCatalogue } = require("./ddv-catalogue");

const OUT = path.join(__dirname, "..", "data", "dreamlight-valley", "furniture.json");

buildCatalogue({
  src: "https://dreamlightvalleywiki.com/Furniture",
  out: OUT,
  label: "furniture",
}).catch((e) => require("./lib/keep")(OUT, e));
