import { test, expect, jest, describe, afterEach } from "@jest/globals";
import ProductDAO from "../../src/dao/productDAO";
import { Category, Product } from "../../src/components/product";
import db from "../../src/db/db";
import { Database } from "sqlite3";

const testProduct = new Product(100, "Samsung S21", Category.SMARTPHONE, "2024-06-01", "S21 512 GB ", 10);
const testProduct2 = new Product(400, "Iphone 12", Category.SMARTPHONE, "2024-06-01", "Iphone 12 512 GB ", 10);

describe("Product DAO unit tests", () => {

    describe("getProduct", () => {
    
        test("It should return a Product", async () => {
            const productDAO = new ProductDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, testProduct)
                return {} as Database
            });
            const result = await productDAO.getProduct(testProduct.model);
            expect(result).toEqual(testProduct);
            mockDBGet.mockRestore();
        })

        test("Should reject with an error", async () => {
            const productDAO = new ProductDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"))
                return {} as Database
            });
            await expect(productDAO.getProduct(testProduct.model)).rejects.toThrow(Error);
            mockDBGet.mockRestore();
        })
    })

    describe("isProductInDB", ()=> {
    
        test("It should return true if the product is in the database", async () => {
            const productDAO = new ProductDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {c: 1})
                return {} as Database
            });
            const result = await productDAO.isProductInDB(testProduct.model);
            expect(result).toBe(true);
            mockDBGet.mockRestore();
        })

        test("It should return false if the product is not in the database", async () => {
            const productDAO = new ProductDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {c: 0})
                return {} as Database
            });
            const result = await productDAO.isProductInDB(testProduct.model);
            expect(result).toBe(false);
            mockDBGet.mockRestore();
        })

        test("Should reject with an error", async () => {
            const productDAO = new ProductDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"))
                return {} as Database
            });
            await expect(productDAO.isProductInDB(testProduct.model)).rejects.toThrow(Error);
            mockDBGet.mockRestore();
        })
    })

    describe("registerProducts", () => {

        test("It should resolve if the product is already in the database", async () => {
            const productDAO = new ProductDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {c: 1})
                return {} as Database
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await productDAO.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);
            expect(mockDBRun).toHaveBeenCalled();
            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        })

        test("It should resolve if the product is not in the database", async () => {
            const productDAO = new ProductDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {c: 0})
                return {} as Database
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await productDAO.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);
            expect(mockDBRun).toHaveBeenCalled();
            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        })

        test("Should reject with an error", async () => {
            const productDAO = new ProductDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"))
                return {} as Database
            });
            await expect(productDAO.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)).rejects.toThrow(Error);
            mockDBGet.mockRestore();
        })

        test("Should reject with an error (reject inside update quantity)", async () => {
            const productDAO = new ProductDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {c: 1})
                return {} as Database
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"))
                return {} as Database
            });
            await expect(productDAO.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)).rejects.toThrow(Error);
            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        })

        test("Should reject with an error (reject inside insert product)", async () => {
            const productDAO = new ProductDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {c: 0})
                return {} as Database
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"))
                return {} as Database
            });
            await expect(productDAO.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)).rejects.toThrow(Error);
            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        })
    })

    describe("changeProductQuantity", () => {

        test("It should resolve if the product quantity is changed", async () => {
            const productDAO = new ProductDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await productDAO.changeProductQuantity(testProduct.model, 12);
            expect(mockDBRun).toHaveBeenCalled();
            mockDBRun.mockRestore();
        })

        test("Should reject with an error", async () => {
            const productDAO = new ProductDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"))
                return {} as Database
            });
            await expect(productDAO.changeProductQuantity(testProduct.model, 12)).rejects.toThrow(Error);
            mockDBRun.mockRestore();
        })
    })

    describe("sellProduct", () => {

        test("It should resolve if the product is sold", async () => {
            const productDAO = new ProductDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await productDAO.sellProduct(testProduct.model, 5);
            expect(mockDBRun).toHaveBeenCalled();
            mockDBRun.mockRestore();
        })

        test("Should reject with an error", async () => {
            const productDAO = new ProductDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"))
                return {} as Database
            });
            await expect(productDAO.sellProduct(testProduct.model, 5)).rejects.toThrow(Error);
            mockDBRun.mockRestore();
        })
    })

    describe("getAllProducts", () => {
        test("It should return an array of Products", async () => {
            const productDAO = new ProductDAO();
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [testProduct, testProduct2])
                return {} as Database
            });
            const result = await productDAO.getAllProducts();
            expect(result).toEqual([testProduct, testProduct2]);
            mockDBAll.mockRestore();
        })

        test("Should reject with an error", async () => {
            const productDAO = new ProductDAO();
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"))
                return {} as Database
            });
            await expect(productDAO.getAllProducts()).rejects.toThrow(Error);
            mockDBAll.mockRestore();
        })
    })

    describe("deleteProducts", () => {
        test("It should resolve if the products are deleted", async () => {
            const productDAO = new ProductDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await productDAO.deleteProducts();
            expect(mockDBRun).toHaveBeenCalled();
            mockDBRun.mockRestore();
        })

        test("Should reject with an error", async () => {
            const productDAO = new ProductDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"))
                return {} as Database
            });
            await expect(productDAO.deleteProducts()).rejects.toThrow(Error);
            mockDBRun.mockRestore();
        })
    })

    describe("deleteProduct", () => {
        test("It should resolve if the product is deleted", async () => {
            const productDAO = new ProductDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await productDAO.deleteProduct(testProduct.model);
            expect(mockDBRun).toHaveBeenCalled();
            mockDBRun.mockRestore();
        })

        test("Should reject with an error", async () => {
            const productDAO = new ProductDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"))
                return {} as Database
            });
            await expect(productDAO.deleteProduct(testProduct.model)).rejects.toThrow(Error);
            mockDBRun.mockRestore();
        })
    })
})