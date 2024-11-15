import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import CartDAO from "../../src/dao/cartDAO"

import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Category, Product } from "../../src/components/product"
import { Role, User } from "../../src/components/user"
import { Cart, ProductInCart } from "../../src/components/cart"

let testUserCustomer = new User("cust","cust_name","cust_surname",Role.CUSTOMER,"","");
let testUserManager = new User("man","man_name","man_surname",Role.MANAGER,"","");
let testUserAdmin = new User("admin","admin_name","admin_surname",Role.ADMIN,"","");

let testProduct1 = new Product(449.99,"Pixel 7a",Category.SMARTPHONE,"2024-06-01","...",1);
let testProduct2 = new Product(899.99,"MacBook Air",Category.LAPTOP,"2024-05-25","...",0);
let testProduct3 = new Product(499.99,"whirlpoolFridge",Category.APPLIANCE,"2024-05-20","...",5);

let emptyCart = new Cart(testUserCustomer.username,false, null as unknown as string, 0.0,[]);
let testPaidCart1 = new Cart(testUserCustomer.username,true,"2024-06-01",testProduct1.sellingPrice+testProduct3.sellingPrice*2,[new ProductInCart(testProduct1.model,1,testProduct1.category,testProduct1.sellingPrice),new ProductInCart(testProduct3.model,2,testProduct3.category,testProduct3.sellingPrice)]);
let testPaidCart2 = new Cart(testUserCustomer.username,true,"2024-06-01",testProduct1.sellingPrice*10,[new ProductInCart(testProduct1.model,10,testProduct1.category,testProduct1.sellingPrice)]);
let testCart3 = new Cart(testUserCustomer.username,false,null as unknown as string,testProduct2.sellingPrice*0,[new ProductInCart(testProduct2.model,2,testProduct2.category,testProduct2.sellingPrice)]);
let testUnpaidCart1 = new Cart(testUserCustomer.username,false,null as unknown as string,testProduct1.sellingPrice*10+testProduct2.sellingPrice*2,[new ProductInCart(testProduct1.model,10,testProduct1.category,testProduct1.sellingPrice),new ProductInCart(testProduct2.model,2,testProduct2.category,testProduct2.sellingPrice)]);

describe("Cart DAO unit tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    })
    describe("getPaidCarts", () => {
        test("Should return a list of paid carts", async () => {
            const cartDAO = new CartDAO();
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [
                    {
                        id: 1,
                        customer: testPaidCart1.customer,
                        paymentDate: testPaidCart1.paymentDate,
                        total: testPaidCart1.total,
                        model: testPaidCart1.products[0].model,
                        quantity: testPaidCart1.products[0].quantity,
                        category: testPaidCart1.products[0].category,
                        sellingPrice: testPaidCart1.products[0].price
                    },
                    {
                        id: 1,
                        customer: testPaidCart1.customer,
                        paymentDate: testPaidCart1.paymentDate,
                        total: testPaidCart1.total,
                        model: testPaidCart1.products[1].model,
                        quantity: testPaidCart1.products[1].quantity,
                        category: testPaidCart1.products[1].category,
                        sellingPrice: testPaidCart1.products[1].price
                    },
                    {
                        id: 2,
                        customer: testPaidCart2.customer,
                        paymentDate: testPaidCart2.paymentDate,
                        total: testPaidCart2.total,
                        model: testPaidCart2.products[0].model,
                        quantity: testPaidCart2.products[0].quantity,
                        category: testPaidCart2.products[0].category,
                        sellingPrice: testPaidCart2.products[0].price
                    }
                ])
                return {} as Database
            });
            const result = await cartDAO.getPaidCarts(testUserCustomer.username);
            expect(result).toEqual([testPaidCart1,testPaidCart2]);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"), [])
                return {} as Database
            });
            await expect(cartDAO.getPaidCarts(testUserCustomer.username)).rejects.toThrow(Error);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        })
    })

    describe("getProduct", () => {
        test("Should return a product", async () => {
            const cartDAO = new CartDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {
                    sellingPrice: testProduct1.sellingPrice,
                    model: testProduct1.model,
                    category: testProduct1.category,
                    arrivalDate: testProduct1.arrivalDate,
                    details: testProduct1.details,
                    quantity: testProduct1.quantity
                })
                return {} as Database
            });
            const result = await cartDAO.getProduct(testProduct1.model);
            expect(result).toEqual(testProduct1);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"), null)
                return {} as Database
            });
            await expect(cartDAO.getProduct(testProduct1.model)).rejects.toThrow(Error);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })
    })

    describe("hasCurrCart", () => {
        test("Should return true", async () => {
            const cartDAO = new CartDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 1,
                    customer: testUserCustomer.username,
                    paid: false,
                    paymentDate: null,
                    total: 0.0
                })
                return {} as Database
            });
            const result = await cartDAO.hasCurrCart(testUserCustomer.username);
            expect(result).toBe(true);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })
        test("Should return false", async () => {
            const cartDAO = new CartDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null)
                return {} as Database
            });
            const result = await cartDAO.hasCurrCart(testUserCustomer.username);
            expect(result).toBe(false);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"), null)
                return {} as Database
            });
            await expect(cartDAO.hasCurrCart(testUserCustomer.username)).rejects.toThrow(Error);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })
    })

    describe("addEmptyCart", () => {
        test("Should add an empty cart", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await cartDAO.addEmptyCart(testUserCustomer.username);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"))
                return {} as Database
            });
            await expect(cartDAO.addEmptyCart(testUserCustomer.username)).rejects.toThrow(Error);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
    })

    describe("getCurrCart", () => {
        test("Should return the current cart", async () => {
            const cartDAO = new CartDAO();
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [
                    {
                        model: testUnpaidCart1.products[0].model,
                        quantity: testUnpaidCart1.products[0].quantity,
                        category: testUnpaidCart1.products[0].category,
                        sellingPrice: testUnpaidCart1.products[0].price,
                        total: testUnpaidCart1.total
                    },
                    {
                        model: testUnpaidCart1.products[1].model,
                        quantity: testUnpaidCart1.products[1].quantity,
                        category: testUnpaidCart1.products[1].category,
                        sellingPrice: testUnpaidCart1.products[1].price,
                        total: testUnpaidCart1.total
                    }
                ])
                return {} as Database
            });
            const result = await cartDAO.getCurrCart(testUserCustomer.username);
            expect(result).toEqual(testUnpaidCart1);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        })
        test("Should return an empty cart", async () => {
            const cartDAO = new CartDAO();
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [])
                return {} as Database
            });
            const result = await cartDAO.getCurrCart(testUserCustomer.username);
            expect(result).toEqual(emptyCart);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"), [])
                return {} as Database
            });
            await expect(cartDAO.getCurrCart(testUserCustomer.username)).rejects.toThrow(Error);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        })
    })

    describe("getCurrCartId", () => {
        test("Should return the cart id", async () => {
            const cartDAO = new CartDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 1
                })
                return {} as Database
            });
            const result = await cartDAO.getCurrCartId(testUserCustomer.username);
            expect(result).toBe(1);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"), null)
                return {} as Database
            });
            await expect(cartDAO.getCurrCartId(testUserCustomer.username)).rejects.toThrow(Error);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })
    })

    describe("addProductInCart", () => {
        test("Should add a product to the cart", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await cartDAO.addProductInCart(testProduct1.model, 1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"))
                return {} as Database
            });
            await expect(cartDAO.addProductInCart(testProduct1.model, 1)).rejects.toThrow(Error);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
    })

    describe("emptyCart", () => {
        test("Should empty the cart", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await cartDAO.emptyCart(1);
            expect(mockDBRun).toHaveBeenCalledTimes(2);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"))
                return {} as Database
            });
            await expect(cartDAO.emptyCart(1)).rejects.toThrow(Error);
            expect(mockDBRun).toHaveBeenCalledTimes(2);
        })
    })

    describe("updateQuantity", () => {
        test("Should update the quantity of a product in the cart", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await cartDAO.updateQuantity(testUnpaidCart1.products[0].model, 1, 1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"))
                return {} as Database
            });
            await expect(cartDAO.updateQuantity(testUnpaidCart1.products[0].model, 1, 1)).rejects.toThrow(Error);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
    })

    describe("updateTotal", () => {
        test("Should update the total of the cart", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await cartDAO.updateTotal(1, testUnpaidCart1.products[0].price);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"))
                return {} as Database
            });
            await expect(cartDAO.updateTotal(1, testUnpaidCart1.products[0].price)).rejects.toThrow(Error);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
    })

    describe("isProductInCart", () => {
        test("Should return true", async () => {
            const cartDAO = new CartDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {
                    cartId:1,
                    model: testUnpaidCart1.products[0].model,
                    quantity: testUnpaidCart1.products[0].quantity
                })
                return {} as Database
            });
            const result = await cartDAO.isProductInCart(testUnpaidCart1.products[0].model, 1);
            expect(result).toBe(true);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })
        test("Should return false", async () => {
            const cartDAO = new CartDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null)
                return {} as Database
            });
            const result = await cartDAO.isProductInCart(testUnpaidCart1.products[0].model, 1);
            expect(result).toBe(false);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"), null)
                return {} as Database
            });
            await expect(cartDAO.isProductInCart(testUnpaidCart1.products[0].model, 1)).rejects.toThrow(Error);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })
    })

    describe("updateStock", () => {
        test("Should update the stock of a product", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await cartDAO.updateStock(testProduct1.model, 1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"))
                return {} as Database
            });
            await expect(cartDAO.updateStock(testProduct1.model, 1)).rejects.toThrow(Error);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
    })

    describe("setPayment", () => {
        test("Should set the payment date of the cart", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await cartDAO.setPayment(1, "2024-06-01");
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"))
                return {} as Database
            });
            await expect(cartDAO.setPayment(1, "2024-06-01")).rejects.toThrow(Error);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
    })

    describe("deleteCarts", () => {
        test("Should delete all carts", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await cartDAO.deleteCarts();
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"))
                return {} as Database
            });
            await expect(cartDAO.deleteCarts()).rejects.toThrow(Error);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
    })

    describe("getCarts", () => {
        test("Should return a list of carts", async () => {
            const cartDAO = new CartDAO();
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [
                    {
                        id: 1,
                        customer: testUnpaidCart1.customer,
                        paid: testUnpaidCart1.paid,
                        paymentDate: testUnpaidCart1.paymentDate,
                        total: testUnpaidCart1.total,
                        model: testUnpaidCart1.products[0].model,
                        quantity: testUnpaidCart1.products[0].quantity,
                        category: testUnpaidCart1.products[0].category,
                        sellingPrice: testUnpaidCart1.products[0].price
                    },
                    {
                        id: 1,
                        customer: testUnpaidCart1.customer,
                        paid: testUnpaidCart1.paid,
                        paymentDate: testUnpaidCart1.paymentDate,
                        total: testUnpaidCart1.total,
                        model: testUnpaidCart1.products[1].model,
                        quantity: testUnpaidCart1.products[1].quantity,
                        category: testUnpaidCart1.products[1].category,
                        sellingPrice: testUnpaidCart1.products[1].price
                    },
                    {
                        id: 2,
                        customer: testPaidCart2.customer,
                        paid: testPaidCart2.paid,
                        paymentDate: testPaidCart2.paymentDate,
                        total: testPaidCart2.total,
                        model: testPaidCart2.products[0].model,
                        quantity: testPaidCart2.products[0].quantity,
                        category: testPaidCart2.products[0].category,
                        sellingPrice: testPaidCart2.products[0].price
                    },
                    {
                        id: 3,
                        customer: testPaidCart1.customer,
                        paid: testPaidCart1.paid,
                        paymentDate: testPaidCart1.paymentDate,
                        total: testPaidCart1.total,
                        model: testPaidCart1.products[0].model,
                        quantity: testPaidCart1.products[0].quantity,
                        category: testPaidCart1.products[0].category,
                        sellingPrice: testPaidCart1.products[0].price
                    },
                    {
                        id: 3,
                        customer: testPaidCart1.customer,
                        paid: testPaidCart1.paid,
                        paymentDate: testPaidCart1.paymentDate,
                        total: testPaidCart1.total,
                        model: testPaidCart1.products[1].model,
                        quantity: testPaidCart1.products[1].quantity,
                        category: testPaidCart1.products[1].category,
                        sellingPrice: testPaidCart1.products[1].price
                    }
                ])
                return {} as Database
            });
            const result = await cartDAO.getCarts();
            expect(result).toEqual([testUnpaidCart1,testPaidCart2,testPaidCart1]);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        })
        test("Should reject with an error", async () => {
            const cartDAO = new CartDAO();
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"), [])
                return {} as Database
            });
            await expect(cartDAO.getCarts()).rejects.toThrow(Error);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        })
    })
})