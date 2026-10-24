import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
export const filterProducts = (items, min) =>
  items.filter((p) => p.price >= min);
export const highestPrice = (items) =>
  items.reduce((best, p) => (!best || p.price > best.price ? p : best), null);
export const totalStock = (items) => items.reduce((sum, p) => sum + p.stock, 0);
export const inventoryValue = (items) =>
  items.reduce((sum, p) => sum + p.price * p.stock, 0);
export const searchProduct = (items, q) =>
  items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
export const revenueByCustomer = (orders) =>
  orders
    .filter((o) => o.status === "completed")
    .reduce(
      (totals, o) => ({
        ...totals,
        [o.customer]: (totals[o.customer] || 0) + o.total,
      }),
      {},
    );
export const topCustomer = (orders) =>
  Object.entries(revenueByCustomer(orders)).sort((a, b) => b[1] - a[1])[0] ??
  null;
export const sortProducts = (items) =>
  [...items].sort((a, b) => a.price - b.price);
const products = JSON.parse(
  await readFile(new URL("./products.json", import.meta.url)),
);
const orders = [
  { customer: "An", total: 100, status: "completed" },
  { customer: "An", total: 20, status: "completed" },
  { customer: "Binh", total: 200, status: "pending" },
];
assert.equal(filterProducts(products, 15).length, 1);
assert.equal(highestPrice(products).name, "Book");
assert.equal(totalStock(products), 19);
assert.equal(inventoryValue(products), 190);
assert.equal(searchProduct(products, "BOOK").length, 2);
assert.deepEqual(revenueByCustomer(orders), { An: 120 });
assert.deepEqual(topCustomer(orders), ["An", 120]);
assert.equal(sortProducts(products)[0].name, "Pen");
assert.equal(highestPrice([]), null);
console.log("8 exercises passed");
