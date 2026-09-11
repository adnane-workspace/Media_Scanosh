import { BURGERS } from "./burgers.js";
import { PIZZA } from "./pizza.js";
import { PASTA } from "./pasta.js";
import { ASIAN } from "./asian.js";
import { GRILL } from "./grill.js";
import { SEAFOOD } from "./seafood.js";
import { SALADS } from "./salads.js";
import { SOUPS } from "./soups.js";
import { SIDES } from "./sides.js";
import { SANDWICHES } from "./sandwiches.js";
import { BREAKFAST } from "./breakfast.js";
import { DESSERTS } from "./desserts.js";
import { BOWLS } from "./bowls.js";
import { OTHER } from "./other.js";
import { MOROCCAN } from "./moroccan/index.js";

/** Classic restaurant dishes (non-Moroccan) */
export const RESTAURANT = [
  ...BURGERS,
  ...PIZZA,
  ...PASTA,
  ...ASIAN,
  ...GRILL,
  ...SEAFOOD,
  ...SALADS,
  ...SOUPS,
  ...SIDES,
  ...SANDWICHES,
  ...BREAKFAST,
  ...DESSERTS,
  ...BOWLS,
  ...OTHER,
];

export { MOROCCAN };
