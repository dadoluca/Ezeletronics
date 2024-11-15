import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import ProductController from "../../src/controllers/productController"

import db from "../../src/db/db"
import { Category, Product } from "../../src/components/product"
import { cleanup } from "../../src/db/cleanup"
import { LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError"
import dayjs from "dayjs"
import { DateError } from "../../src/utilities"

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
            ('rog strix', 2300.99, 'Laptop', '2023-07-22', 'Asus Rog Strix G17, 16GB RAM, 1TB SSD', 0, TRUE),
            ('surfacePro', 1299.99, 'Laptop', '2023-08-20', 'Microsoft Surface Pro 7, 16GB RAM, 256GB SSD', 10, TRUE),
            ('xbox', 499.99, 'Appliance', '2024-01-15', 'Xbox Series x 1TB Black', 0, FALSE),
            ('boschWashingMachine', 799.99, 'Appliance', '2023-07-15', 'Bosch 300 Series Front Load Washer', 0, TRUE);`);
    })
})

describe("Product Controller-DAO-DB integration tests", () => {

    describe("registerProducts", () => {
    
        test("Should insert a new product", async () => {
            const controller = new ProductController();
            await controller.registerProducts("iphone15", "Smartphone", 10, "New product", 999.99, "2024-02-01");
            const products = await controller.getProducts(null, null, null);
            expect(products).toContainEqual(new Product(999.99, "iphone15", Category.SMARTPHONE, "2024-02-01", "New product", 10));
        })

        test("Should return an error if the product is already in the database", async () => {
            const controller = new ProductController();
            await expect(controller.registerProducts("iphone14", "Smartphone", 10, "New product", 999.99, "2024-02-01")).rejects.toThrowError(new ProductAlreadyExistsError);
        })

        test("Should insert a new product with default arrival date", async () => {
            const controller = new ProductController();
            await controller.registerProducts("iphone16", "Smartphone", 10, "New product", 999.99, null);
            const products = await controller.getProducts(null, null, null);
            expect(products).toContainEqual(new Product(999.99, "iphone16", Category.SMARTPHONE, dayjs().format("YYYY-MM-DD"), "New product", 10));
        })

        test("Should return an error if the arrival date is in the future", async () => {
            const controller = new ProductController();
            await expect(controller.registerProducts("iphone17", "Smartphone", 10, "New product", 999.99, "2025-02-01")).rejects.toThrowError(new DateError);
        })
    })

    describe("changeProductQuantity", () => {
    
        test("Should increase the quantity of the product", async () => {
            const controller = new ProductController();
            await controller.changeProductQuantity("iphone14", 10, "2024-02-01");
            const products = await controller.getProducts(null, null, null);
            expect(products).toContainEqual(new Product(999.99, "iphone14", Category.SMARTPHONE, "2023-09-15", "Apple iPhone 14, 128GB", 60));
        })

        test("Should return an error if the product is not in the database", async () => {
            const controller = new ProductController();
            await expect(controller.changeProductQuantity("wrong", 10, "2024-02-01")).rejects.toThrowError(new ProductNotFoundError);
        })

        test("Should return an error if the arrival date is in the future", async () => {
            const controller = new ProductController();
            await expect(controller.changeProductQuantity("iphone14", 10, "2025-02-01")).rejects.toThrowError(new DateError);
        })
    })

    describe("sellProduct", () => {

        test("Should decrease the quantity of the product", async () => {
            const controller = new ProductController();
            await controller.sellProduct("iphone14", 60, "2024-02-01");
            const products = await controller.getProducts(null, null, null);
            expect(products).toContainEqual(new Product(999.99, "iphone14", Category.SMARTPHONE, "2023-09-15", "Apple iPhone 14, 128GB", 0));
        })

        test("Should return an error if the product is not in the database", async () => {
            const controller = new ProductController();
            await expect(controller.sellProduct("wrong", 10, "2024-02-01")).rejects.toThrowError(new ProductNotFoundError);
        })

        test("Should return an error if the quantity is greater than the available quantity", async () => {
            const controller = new ProductController();
            await expect(controller.sellProduct("iphone14", 100, null)).rejects.toThrowError(new LowProductStockError);
        })

        test("Should return an error if the arrival date is in the future", async () => {
            const controller = new ProductController();
            await expect(controller.sellProduct("iphone14", 10, "2025-02-01")).rejects.toThrowError(new DateError);
        })
    })

    describe("getProduct", () => {

        test("Should return all products in the database (grouping=null, category=null, model=null)", async () => {
            const controller = new ProductController();
            const products = await controller.getProducts(null, null, null);
            expect(products).toEqual([
                    new Product(999.99, 'iphone14', Category.SMARTPHONE, '2023-09-15', 'Apple iPhone 14, 128GB', 0),
                    new Product(799.99, 'galaxyS21', Category.SMARTPHONE, '2023-08-10', 'Samsung Galaxy S21, 256GB', 30),
                    new Product(1999.99, 'macbookPro', Category.LAPTOP, '2023-07-20', 'Apple MacBook Pro 16"', 20),
                    new Product(1099.99, 'dellXPS13', Category.LAPTOP, '2023-07-22', 'Dell XPS 13, 16GB RAM, 512GB SSD', 15),
                    new Product(499.99, 'whirlpoolFridge', Category.APPLIANCE, '2023-06-25', 'Whirlpool 18 cu. ft. Top Freezer Refrigerator', 10),
                    new Product(799.99, 'ipadPro', Category.SMARTPHONE, '2023-10-10', 'Apple iPad Pro 11-inch, 128GB', 25),
                    new Product(499.99, 'ps5', Category.APPLIANCE, '2023-11-15', 'Sony PlayStation 5', 40),
                    new Product(199.99, 'airpods', Category.SMARTPHONE, '2023-09-01', 'Apple AirPods Pro', 100),
                    new Product(2300.99, 'rog strix', Category.LAPTOP, '2023-07-22', 'Asus Rog Strix G17, 16GB RAM, 1TB SSD', 0),
                    new Product(1299.99, 'surfacePro', Category.LAPTOP, '2023-08-20', 'Microsoft Surface Pro 7, 16GB RAM, 256GB SSD', 10),
                    new Product(799.99, 'boschWashingMachine', Category.APPLIANCE, '2023-07-15', 'Bosch 300 Series Front Load Washer', 0),
                    new Product(999.99, 'iphone15', Category.SMARTPHONE, '2024-02-01', 'New product', 10),
                    new Product(999.99, 'iphone16', Category.SMARTPHONE, dayjs().format("YYYY-MM-DD"), 'New product', 10)]);
        })

        test("Should return only the product with the specified model (grouping=model, category=null, model='iphone14')", async () => {
            const controller = new ProductController();
            const products = await controller.getProducts("model", null, "iphone14");
            expect(products).toEqual([new Product(999.99, "iphone14", Category.SMARTPHONE, "2023-09-15", "Apple iPhone 14, 128GB", 0)]);
        })

        test("Should return only the products with the specified category (grouping=category, category='Smartphone', model=null)", async () => {
            const controller = new ProductController();
            const products = await controller.getProducts("category", "Smartphone", null);
            expect(products).toEqual([new Product(999.99, "iphone14", Category.SMARTPHONE, "2023-09-15", "Apple iPhone 14, 128GB", 0),
                                      new Product(799.99, "galaxyS21", Category.SMARTPHONE, "2023-08-10", "Samsung Galaxy S21, 256GB", 30),
                                      new Product(799.99, "ipadPro", Category.SMARTPHONE, "2023-10-10", "Apple iPad Pro 11-inch, 128GB", 25),
                                      new Product(199.99, "airpods", Category.SMARTPHONE, "2023-09-01", "Apple AirPods Pro", 100),
                                      new Product(999.99, "iphone15", Category.SMARTPHONE, "2024-02-01", "New product", 10),
                                      new Product(999.99, "iphone16", Category.SMARTPHONE, dayjs().format("YYYY-MM-DD"), "New product", 10)]);
        })

        test("Should return an error if the model is not in the database", async () => {
            const controller = new ProductController();
            await expect(controller.getProducts("model", null, "wrong")).rejects.toThrowError(new ProductNotFoundError);
        })
    })

    describe("getAvailableProducts", () => {

        test("Should return all available products in the database (grouping=null, category=null, model=null)", async () => {
            const controller = new ProductController();
            const products = await controller.getAvailableProducts(null, null, null);
            expect(products).toEqual([
                    new Product(799.99, 'galaxyS21', Category.SMARTPHONE, '2023-08-10', 'Samsung Galaxy S21, 256GB', 30),
                    new Product(1999.99, 'macbookPro', Category.LAPTOP, '2023-07-20', 'Apple MacBook Pro 16"', 20),
                    new Product(1099.99, 'dellXPS13', Category.LAPTOP, '2023-07-22', 'Dell XPS 13, 16GB RAM, 512GB SSD', 15),
                    new Product(499.99, 'whirlpoolFridge', Category.APPLIANCE, '2023-06-25', 'Whirlpool 18 cu. ft. Top Freezer Refrigerator', 10),
                    new Product(799.99, 'ipadPro', Category.SMARTPHONE, '2023-10-10', 'Apple iPad Pro 11-inch, 128GB', 25),
                    new Product(499.99, 'ps5', Category.APPLIANCE, '2023-11-15', 'Sony PlayStation 5', 40),
                    new Product(199.99, 'airpods', Category.SMARTPHONE, '2023-09-01', 'Apple AirPods Pro', 100),
                    new Product(1299.99, 'surfacePro', Category.LAPTOP, '2023-08-20', 'Microsoft Surface Pro 7, 16GB RAM, 256GB SSD', 10),
                    new Product(999.99, 'iphone15', Category.SMARTPHONE, '2024-02-01', 'New product', 10),
                    new Product(999.99, 'iphone16', Category.SMARTPHONE, dayjs().format("YYYY-MM-DD"), 'New product', 10)]);
        })

        test("Should return only the available product with the specified model (grouping=model, category=null, model='iphone14')", async () => {
            const controller = new ProductController();
            const products = await controller.getAvailableProducts("model", null, "iphone15");
            expect(products).toEqual([new Product(999.99, "iphone15", Category.SMARTPHONE, "2024-02-01", "New product", 10)]);
        })

        test("Should return only the available products with the specified category (grouping=category, category='Smartphone', model=null)", async () => {
            const controller = new ProductController();
            const products = await controller.getAvailableProducts("category", "Smartphone", null);
            expect(products).toEqual([
                                      new Product(799.99, "galaxyS21", Category.SMARTPHONE, "2023-08-10", "Samsung Galaxy S21, 256GB", 30),
                                      new Product(799.99, "ipadPro", Category.SMARTPHONE, "2023-10-10", "Apple iPad Pro 11-inch, 128GB", 25),
                                      new Product(199.99, "airpods", Category.SMARTPHONE, "2023-09-01", "Apple AirPods Pro", 100),
                                      new Product(999.99, "iphone15", Category.SMARTPHONE, "2024-02-01", "New product", 10),
                                      new Product(999.99, "iphone16", Category.SMARTPHONE, dayjs().format("YYYY-MM-DD"), "New product", 10)]);
        })
    })

    describe("deleteProduct", () => {

        test("Should delete one product", async () => {
            const controller = new ProductController();
            await controller.deleteProduct("iphone15");
            const products = await controller.getProducts(null, null, null);
            expect(products).not.toContainEqual(new Product(999.99, "iphone15", Category.SMARTPHONE, "2024-02-01", "New product", 10));
        })

        test("Should return an error if the product is not in the database", async () => {
            const controller = new ProductController();
            await expect(controller.deleteProduct("wrong")).rejects.toThrowError(new ProductNotFoundError);
        })
    })

    describe("deleteAllProducts", () => {
      
        test("Should delete all products", async () => {
            const controller = new ProductController();
            await controller.deleteAllProducts();
            const products = await controller.getProducts(null, null, null);
            expect(products).toEqual([]);
        })
    })

    
})