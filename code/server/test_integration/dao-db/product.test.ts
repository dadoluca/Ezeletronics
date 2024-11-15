import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import ProductDAO from "../../src/dao/productDAO"

import db from "../../src/db/db"
import { Category, Product } from "../../src/components/product"
import { cleanup } from "../../src/db/cleanup"


beforeAll(async() => {
    await cleanup();
    db.serialize(() => {
        db.run(`INSERT INTO products (model, sellingPrice, category, arrivalDate, details, quantity, visible) VALUES
            ('iphone14', 999.99, 'Smartphone', '2023-09-15', 'Apple iPhone 14, 128GB', 50, TRUE),
            ('galaxyS21', 799.99, 'Smartphone', '2023-08-10', 'Samsung Galaxy S21, 256GB', 30, TRUE),
            ('macbookPro', 1999.99, 'Laptop', '2023-07-20', 'Apple MacBook Pro 16"', 20, TRUE),
            ('dellXPS13', 1099.99, 'Laptop', '2023-07-22', 'Dell XPS 13, 16GB RAM, 512GB SSD', 15, TRUE),
            ('whirlpoolFridge', 499.99, 'Appliance', '2023-06-25', 'Whirlpool 18 cu. ft. Top Freezer Refrigerator', 10, TRUE),
            ('ipadPro', 799.99, 'Smartphone', '2023-10-10', 'Apple iPad Pro 11-inch, 128GB', 25, TRUE),
            ('ps5', 499.99, 'Appliance', '2023-11-15', 'Sony PlayStation 5', 40, TRUE),
            ('airpods', 199.99, 'Smartphone', '2023-09-01', 'Apple AirPods Pro', 100, TRUE),
            ('surfacePro', 1299.99, 'Laptop', '2023-08-20', 'Microsoft Surface Pro 7, 16GB RAM, 256GB SSD', 10, TRUE),
            ('xbox', 499.99, 'Appliance', '2024-01-15', 'Xbox Series x 1TB Black', 0, FALSE),
            ('boschWashingMachine', 799.99, 'Appliance', '2023-07-15', 'Bosch 300 Series Front Load Washer', 8, TRUE);`);
    })
})

describe("Product DAO integration tests", () => {

    describe("getProduct", () => {

        test("Should return the product", async () => {
            const dao = new ProductDAO();
            const product = await dao.getProduct("iphone14");
            expect(product).toEqual(new Product(999.99, "iphone14", Category.SMARTPHONE, "2023-09-15", "Apple iPhone 14, 128GB", 50));
        })
    })

    describe("isProductInDB", () => {

        test("Should return true", async () => {
            const dao = new ProductDAO();
            const result = await dao.isProductInDB("iphone14");
            expect(result).toBe(true);
        })

        test("Should return false", async () => {
            const dao = new ProductDAO();
            const result = await dao.isProductInDB("wrong");
            expect(result).toBe(false);
        })
    })

    describe("registerProducts", () => {

        test("Should insert a new product", async () => {
            const dao = new ProductDAO();
            await dao.registerProducts("iphone15", "Smartphone", 10, "New product", 999.99, "2024-12-01");
            const product = await dao.getProduct("iphone15");
            expect(product).toEqual(new Product(999.99, "iphone15", Category.SMARTPHONE, "2024-12-01", "New product", 10));
        })

        test("Should update an existing product", async () => {
            const dao = new ProductDAO();
            await dao.registerProducts("xbox", "Appliance", 60, "Xbox Series x 1TB Black", 499.99, "2024-01-15");
            const product = await dao.getProduct("xbox");
            expect(product).toEqual(new Product(499.99, "xbox", Category.APPLIANCE, "2024-01-15", "Xbox Series x 1TB Black", 60));
        })
    })

    describe("changeProductQuantity", () => {

        test("Should increase the quantity", async () => {
            const dao = new ProductDAO();
            await dao.changeProductQuantity("iphone14", 10);
            const product = await dao.getProduct("iphone14");
            expect(product).toEqual(new Product(999.99, "iphone14", Category.SMARTPHONE, "2023-09-15", "Apple iPhone 14, 128GB", 60));
        })
    })

    describe("sellProduct", () => {

        test("Should decrease the quantity", async () => {
            const dao = new ProductDAO();
            await dao.sellProduct("iphone14", 5);
            const product = await dao.getProduct("iphone14");
            expect(product).toEqual(new Product(999.99, "iphone14", Category.SMARTPHONE, "2023-09-15", "Apple iPhone 14, 128GB", 55));
        })
    })

    describe("getAllProducts", () => {
    
        test("Should return all visible products", async () => {
            const dao = new ProductDAO();
            const products = await dao.getAllProducts();
            expect(products).toEqual([new Product(999.99, "iphone14", Category.SMARTPHONE, "2023-09-15", "Apple iPhone 14, 128GB", 55),
                                      new Product(799.99, "galaxyS21", Category.SMARTPHONE, "2023-08-10", "Samsung Galaxy S21, 256GB", 30),
                                      new Product(1999.99, "macbookPro", Category.LAPTOP, "2023-07-20", "Apple MacBook Pro 16\"", 20),
                                      new Product(1099.99, "dellXPS13", Category.LAPTOP, "2023-07-22", "Dell XPS 13, 16GB RAM, 512GB SSD", 15),
                                      new Product(499.99, "whirlpoolFridge", Category.APPLIANCE, "2023-06-25", "Whirlpool 18 cu. ft. Top Freezer Refrigerator", 10),
                                      new Product(799.99, "ipadPro", Category.SMARTPHONE, "2023-10-10", "Apple iPad Pro 11-inch, 128GB", 25),
                                      new Product(499.99, "ps5", Category.APPLIANCE, "2023-11-15", "Sony PlayStation 5", 40),
                                      new Product(199.99, "airpods", Category.SMARTPHONE, "2023-09-01", "Apple AirPods Pro", 100),
                                      new Product(1299.99, "surfacePro", Category.LAPTOP, "2023-08-20", "Microsoft Surface Pro 7, 16GB RAM, 256GB SSD", 10),
                                      new Product(499.99, "xbox", Category.APPLIANCE, "2024-01-15", "Xbox Series x 1TB Black", 60),
                                      new Product(799.99, "boschWashingMachine", Category.APPLIANCE, "2023-07-15", "Bosch 300 Series Front Load Washer", 8),
                                      new Product(999.99, "iphone15", Category.SMARTPHONE, "2024-12-01", "New product", 10)]);

        })
    })

    describe("deleteProduct", () => {

        test("Should delete one product", async () => {
            const dao = new ProductDAO();
            await dao.deleteProduct("iphone15");
            const products = await dao.getAllProducts();
            expect(products).toEqual([new Product(999.99, "iphone14", Category.SMARTPHONE, "2023-09-15", "Apple iPhone 14, 128GB", 55),
                                      new Product(799.99, "galaxyS21", Category.SMARTPHONE, "2023-08-10", "Samsung Galaxy S21, 256GB", 30),
                                      new Product(1999.99, "macbookPro", Category.LAPTOP, "2023-07-20", "Apple MacBook Pro 16\"", 20),
                                      new Product(1099.99, "dellXPS13", Category.LAPTOP, "2023-07-22", "Dell XPS 13, 16GB RAM, 512GB SSD", 15),
                                      new Product(499.99, "whirlpoolFridge", Category.APPLIANCE, "2023-06-25", "Whirlpool 18 cu. ft. Top Freezer Refrigerator", 10),
                                      new Product(799.99, "ipadPro", Category.SMARTPHONE, "2023-10-10", "Apple iPad Pro 11-inch, 128GB", 25),
                                      new Product(499.99, "ps5", Category.APPLIANCE, "2023-11-15", "Sony PlayStation 5", 40),
                                      new Product(199.99, "airpods", Category.SMARTPHONE, "2023-09-01", "Apple AirPods Pro", 100),
                                      new Product(1299.99, "surfacePro", Category.LAPTOP, "2023-08-20", "Microsoft Surface Pro 7, 16GB RAM, 256GB SSD", 10),
                                      new Product(499.99, "xbox", Category.APPLIANCE, "2024-01-15", "Xbox Series x 1TB Black", 60),
                                      new Product(799.99, "boschWashingMachine", Category.APPLIANCE, "2023-07-15", "Bosch 300 Series Front Load Washer", 8)]);
        })
    })

    describe("deleteProducts", () => {

        test("Should delete all products", async () => {
            const dao = new ProductDAO();
            await dao.deleteProducts();
            const products = await dao.getAllProducts();
            expect(products).toEqual([]);
        })
    })
})
