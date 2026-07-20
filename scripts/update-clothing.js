/* Full clothing catalogue → data/dreamlight-valley/clothing.json.
   Lazy-loaded by the Items Database's Clothing tab. See ddv-catalogue.js. */
const path = require("path");
const { buildCatalogue } = require("./ddv-catalogue");

const OUT = path.join(__dirname, "..", "data", "dreamlight-valley", "clothing.json");

buildCatalogue({
  src: "https://dreamlightvalleywiki.com/Clothing",
  out: OUT,
  label: "clothing",
}).catch((e) => require("./lib/keep")(OUT, e));
