import { test, expect, jest, describe, afterEach } from "@jest/globals";
import ProductController from "../../src/controllers/productController";
import ProductDAO from "../../src/dao/productDAO";
import { ProductAlreadyExistsError, ProductNotFoundError, LowProductStockError } from "../../src/errors/productError";
import { DateError } from "../../src/utilities";
import { Category, Product } from "../../src/components/product";
import ErrorHandler from "../../src/helper";
import  request from "supertest";
import { app } from "../../index"
import Authenticator from "../../src/routers/auth";

const baseURL = "/ezelectronics"

jest.mock("../../src/routers/auth")

describe("Product route unit tests", ()=>{

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks(); 
    });

    describe("POST /products", () => {
        test("It should return a 200 success code", async () => {
            const testProduct = { model: "Dell XPS 13", category: Category.LAPTOP, quantity: 100, details: "Dell XPS 13, 16GB RAM, 512GB SSD", sellingPrice: 999, arrivalDate: "2024-01-01" }
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isInt: () => ({ isLength: () => ({}) }),
                    isDate: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()

            const response = await request(app).post(baseURL + "/products").send(testProduct)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.registerProducts).toHaveBeenCalled()
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)
        })

        test("It should fail if the user is not an admin or a manager", async () => {
            const testProduct = { model: "Dell XPS 13", category: Category.LAPTOP, quantity: 100, details: "Dell XPS 13, 16GB RAM, 512GB SSD", sellingPrice: 999, arrivalDate: "2024-01-01" }

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" })
            })

            const response = await request(app).post(baseURL + "/products").send(testProduct)
            expect(response.status).toBe(401)
        })

        test("It should return an error if something fails", async () => {
            const testProduct = { model: "Dell XPS 13", category: Category.LAPTOP, quantity: 100, details: "Dell XPS 13, 16GB RAM, 512GB SSD", sellingPrice: 999, arrivalDate: "2024-01-01" }

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isInt: () => ({ isLength: () => ({}) }),
                    isDate: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new Error("Error"))

            const response = await request(app).post(baseURL + "/products").send(testProduct)
            expect(response.status).toBeGreaterThanOrEqual(400)
        })
    })

    describe("PATCH /products/:model", () => {
    
        test("It should return a 200 success code", async () => {
            const testProduct = { model: "Dell XPS 13", category: Category.LAPTOP, quantity: 100, details: "Dell XPS 13, 16GB RAM, 512GB SSD", sellingPrice: 999, changeDate: "2024-01-01" }
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isInt: () => ({ isLength: () => ({}) }),
                    isDate: () => ({ isLength: () => ({}) }),
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(testProduct.quantity)

            const response = await request(app).patch(baseURL + "/products/Dell XPS 13").send(testProduct)
            expect(response.status).toBe(200)
            expect(response.body).toEqual({quantity: testProduct.quantity})
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled()
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(testProduct.model, testProduct.quantity, testProduct.changeDate)
        })

        test("It should return an error if something fails", async () => {
            const testProduct = { model: "Dell XPS 13", category: Category.LAPTOP, quantity: 100, details: "Dell XPS 13, 16GB RAM, 512GB SSD", sellingPrice: 999, changeDate: "2024-01-01" }

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isInt: () => ({ isLength: () => ({}) }),
                    isDate: () => ({ isLength: () => ({}) }),
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new Error("Error"))

            const response = await request(app).patch(baseURL + "/products/Dell XPS 13").send(testProduct)
            expect(response.status).toBeGreaterThanOrEqual(400)
        })
    })

    describe("PATCH /products/:model/sell/", () => {
    
        test("It should return a 200 success code", async () => {
            const testProduct = { model: "Dell XPS 13", quantity: 10, sellingDate: "2024-01-01" }
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isInt: () => ({ isLength: () => ({}) }),
                    isDate: () => ({ isLength: () => ({}) }),
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(testProduct.quantity)

            const response = await request(app).patch(baseURL + "/products/Dell XPS 13/sell").send(testProduct)
            expect(response.status).toBe(200)
            expect(response.body).toEqual({quantity: testProduct.quantity})
            expect(ProductController.prototype.sellProduct).toHaveBeenCalled()
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(testProduct.model, testProduct.quantity, testProduct.sellingDate)
        })

        test("It should return an error if something fails", async () => {
            const testProduct = { model: "Dell XPS 13", quantity: 10, sellingDate: "2024-01-01" }

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isInt: () => ({ isLength: () => ({}) }),
                    isDate: () => ({ isLength: () => ({}) }),
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new Error("Error"))

            const response = await request(app).patch(baseURL + "/products/Dell XPS 13/sell").send(testProduct)
            expect(response.status).toBeGreaterThanOrEqual(400)
        })
    })

    describe("GET /products", () => {
        test("It should return a 200 success code", async () => {
            const testProducts = [{ model: "Dell XPS 13", category: Category.LAPTOP, quantity: 100, details: "Dell XPS 13, 16GB RAM, 512GB SSD", sellingPrice: 999, arrivalDate: "2024-01-01" }]
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(testProducts)

            const response = await request(app).get(baseURL + "/products")
            expect(response.status).toBe(200)
            expect(response.body).toEqual(testProducts)
            expect(ProductController.prototype.getProducts).toHaveBeenCalled()
        })

        test("It should return a 200 success code (grouping=category, model=null, category!=null)", async () => {
            const testProducts = [{ model: "Dell XPS 13", category: Category.LAPTOP, quantity: 100, details: "Dell XPS 13, 16GB RAM, 512GB SSD", sellingPrice: 999, arrivalDate: "2024-01-01" }]

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            //jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([])
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(testProducts)

            const response = await request(app).get(baseURL + "/products?grouping=category&category=Laptop")
            expect(response.status).toBe(200)
        })

        test("It should return an error if one condition is not met (grouping=category, model=null, category=null)", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/products?grouping=category")
            expect(response.status).toBe(422)
        })

        test("It should return an error if one condition is not met (grouping=model, model=null, category=null)", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/products?grouping=model")
            expect(response.status).toBe(422)
        })


        test("It should return an error if something fails", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(new Error("Error"))

            const response = await request(app).get(baseURL + "/products")
            expect(response.status).toBeGreaterThanOrEqual(400)
        })
    })

    describe("GET /products/available", () => {

        test("It should return a 200 success code", async () => {
            const testProducts = [{ model: "Dell XPS 13", category: Category.LAPTOP, quantity: 100, details: "Dell XPS 13, 16GB RAM, 512GB SSD", sellingPrice: 999, arrivalDate: "2024-01-01" }, 
            { model: "Dell XPS 15", category: Category.LAPTOP, quantity: 0, details: "Dell XPS 15, 16GB RAM, 512GB SSD", sellingPrice: 1299, arrivalDate: "2024-01-01" }
            ]
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce(testProducts)
            
            const response = await request(app).get(baseURL + "/products/available")
            
            expect(response.status).toBe(200)
            expect(response.body).toEqual(testProducts)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalled()
        })

        test("It should return a 200 success code (grouping=category, model=null, category!=null)", async () => {
            const testProducts = [{ model: "Dell XPS 13", category: Category.LAPTOP, quantity: 100, details: "Dell XPS 13, 16GB RAM, 512GB SSD", sellingPrice: 999, arrivalDate: "2024-01-01" }]

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce(testProducts)

            const response = await request(app).get(baseURL + "/products/available?grouping=category&category=Laptop")
            expect(response.status).toBe(200)
        })

        test("It should return an error if one condition is not met (grouping=category, model=null, category=null)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/products/available?grouping=category")
            expect(response.status).toBe(422)
        })

        test("It should return an error if one condition is not met (grouping=model, model=null, category=null)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/products/available?grouping=model")
            expect(response.status).toBe(422)
        })

        test("It should return an error if something fails", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(new Error("Error"))

            const response = await request(app).get(baseURL + "/products/available")
            expect(response.status).toBeGreaterThanOrEqual(400)
        })
    })

    describe("DELETE /products", () => {

        test("It should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)

            const response = await request(app).delete(baseURL + "/products")
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalled()
        })

        test("It should return an error if something fails", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockRejectedValueOnce(new Error("Error"))

            const response = await request(app).delete(baseURL + "/products")
            expect(response.status).toBeGreaterThanOrEqual(400)
        })
    })

    describe("DELETE /products/:model", () => {

        test("It should return a 200 success code", async () => {
            const testModel = "Dell XPS 13"
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)

            const response = await request(app).delete(baseURL + "/products/" + testModel)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalled()
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith(testModel)
        })

        test("It should return an error if something fails", async () => {
            const testModel = "Dell XPS 13"
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValueOnce(new Error("Error"))

            const response = await request(app).delete(baseURL + "/products/" + testModel)
            expect(response.status).toBeGreaterThanOrEqual(400)
        })
    })
})