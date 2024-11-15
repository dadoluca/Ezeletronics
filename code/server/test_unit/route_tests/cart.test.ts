import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import { Role, User } from "../../src/components/user"
import { app } from "../../index"
import request from 'supertest'
import { Cart, ProductInCart } from "../../src/components/cart"
import { Category, Product } from "../../src/components/product"
import CartController from "../../src/controllers/cartController"
import { cleanup } from "../../src/db/cleanup"
import Authenticator from "../../src/routers/auth"
import { after, beforeEach } from "node:test"
import ErrorHandler from "../../src/helper"
import express from "express"
import CartRoutes from "../../src/routers/cartRoutes"
import { UserNotAdminError, UserNotCustomerError, UserNotManagerError } from "../../src/errors/userError"

const baseURL = "/ezelectronics"
jest.mock("../../src/controllers/cartController");
jest.mock("../../src/routers/auth");

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


describe("Cart routes unit tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    })
    describe("GET /carts", () => {
        test("It should return a 200 success code", async () => {
            const getCart =jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(testPaidCart1);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).get(baseURL + "/carts");

            expect(response.status).toBe(200);
            expect(response.body).toEqual(testPaidCart1);

            expect(getCart).toHaveBeenCalledTimes(1);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        }) 
        test("It should return a 401 error code (user not logged in)", async () => {
            const getCart =jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(testPaidCart1);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).get(baseURL + "/carts");

            expect(response.status).toBe(401);
            expect(getCart).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).not.toHaveBeenCalled();
        })
        test("It should return a 401 error code (user is not a customer)", async () => {
            const getCart =jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(testPaidCart1);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            
            const response = await request(app).get(baseURL + "/carts");

            expect(response.status).toBe(401);
            expect(getCart).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        })
        test("It should return an error", async () => {
            const getCart =jest.spyOn(CartController.prototype, "getCart").mockRejectedValueOnce(new Error("Error"));
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).get(baseURL + "/carts");

            expect(response.status).not.toBe(200);
            expect(getCart).toHaveBeenCalledTimes(1);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        })
    })

    describe("POST /carts", () => {
        test("It should return a 200 success code", async () => {
            const addToCart =jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());


            const response = await request(app).post(baseURL + "/carts").send({model: testProduct1.model});

            expect(response.status).toBe(200);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
            expect(addToCart).toHaveBeenCalledTimes(1);
        }) 
        test("It should return a 401 error code (user not logged in)", async () => {
            const addToCart =jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());

            const response = await request(app).post(baseURL + "/carts").send({model: testProduct1.model});

            expect(response.status).toBe(401);
            expect(addToCart).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).not.toHaveBeenCalled();
        })
        test("It should return a 401 error code (user is not a customer)", async () => {
            const addToCart =jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => res.status(401).send());

            const response = await request(app).post(baseURL + "/carts").send({model: testProduct1.model});

            expect(response.status).toBe(new UserNotCustomerError().customCode);
            expect(addToCart).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        })
        test("It should return a 422 error code (missing model)", async () => {
            const addToCart =jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());

            const response = await request(app).post(baseURL + "/carts");

            expect(response.status).toBe(422);
            expect(addToCart).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        })
        test("It should return an error", async () => {
            const addToCart =jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new Error("Error"));
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());

            const response = await request(app).post(baseURL + "/carts").send({model: testProduct1.model});

            expect(response.status).not.toBe(200);
            expect(addToCart).toHaveBeenCalledTimes(1);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        })
    })
    describe("PATCH /carts", () => {
        test("It should return a 200 success code", async () => {
            const checkoutCart =jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).patch(baseURL + "/carts");

            expect(response.status).toBe(200);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
            expect(checkoutCart).toHaveBeenCalledTimes(1);
        }) 
        test("It should return a 401 error code (user not logged in)", async () => {
            const checkoutCart =jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).patch(baseURL + "/carts");

            expect(response.status).toBe(401);
            expect(checkoutCart).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).not.toHaveBeenCalled();
        })
        test("It should return a 401 error code (user is not a customer)", async () => {
            const checkoutCart =jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            
            const response = await request(app).patch(baseURL + "/carts");

            expect(response.status).toBe(401);
            expect(checkoutCart).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        })
        test("It should return an error", async () => {
            const checkoutCart =jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new Error("Error"));
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).patch(baseURL + "/carts");

            expect(response.status).not.toBe(200);
            expect(checkoutCart).toHaveBeenCalledTimes(1);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        })
    })

    describe("GET /carts/history", () => {
        test("It should return a 200 success code", async () => {
            const getCustomerCarts =jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([testPaidCart1,testPaidCart2]);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).get(baseURL + "/carts/history");

            expect(response.status).toBe(200);
            expect(response.body).toEqual([testPaidCart1,testPaidCart2]);

            expect(getCustomerCarts).toHaveBeenCalledTimes(1);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        }) 
        test("It should return a 401 error code (user not logged in)", async () => {
            const getCustomerCarts =jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([testPaidCart1,testPaidCart2]);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).get(baseURL + "/carts/history");

            expect(response.status).toBe(401);
            expect(getCustomerCarts).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).not.toHaveBeenCalled();
        })
        test("It should return a 401 error code (user is not a customer)", async () => {
            const getCustomerCarts =jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([testPaidCart1,testPaidCart2]);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            
            const response = await request(app).get(baseURL + "/carts/history");

            expect(response.status).toBe(401);
            expect(getCustomerCarts).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        }) 
        test("It should return an error", async () => {
            const getCustomerCarts =jest.spyOn(CartController.prototype, "getCustomerCarts").mockRejectedValueOnce(new Error("Error"));
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).get(baseURL + "/carts/history");

            expect(response.status).not.toBe(200);
            expect(getCustomerCarts).toHaveBeenCalledTimes(1);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        })
    })

    describe("DELETE /carts/products/:model", () => {
        test("It should return a 200 success code", async () => {
            const removeProductFromCart =jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());

            const response = await request(app).delete(baseURL + "/carts/products/"+testProduct1.model);

            expect(response.status).toBe(200);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
            expect(removeProductFromCart).toHaveBeenCalledTimes(1);
        }) 
        test("It should return a 401 error code (user not logged in)", async () => {
            const removeProductFromCart =jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());

            const response = await request(app).delete(baseURL + "/carts/products/"+testProduct1.model);

            expect(response.status).toBe(401);
            expect(removeProductFromCart).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).not.toHaveBeenCalled();
        })
        test("It should return a 401 error code (user is not a customer)", async () => {
            const removeProductFromCart =jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => res.status(401).send());

            const response = await request(app).delete(baseURL + "/carts/products/"+testProduct1.model);

            expect(response.status).toBe(401);
            expect(removeProductFromCart).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        })
        test("It should return an error", async () => {
            const removeProductFromCart =jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new Error("Error"));
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());

            const response = await request(app).delete(baseURL + "/carts/products/"+testProduct1.model);

            expect(response.status).not.toBe(200);
            expect(removeProductFromCart).toHaveBeenCalledTimes(1);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        })

    })

    describe("DELETE /carts/current", () => {
        test("It should return a 200 success code", async () => {
            const clearCart =jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).delete(baseURL + "/carts/current");

            expect(response.status).toBe(200);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
            expect(clearCart).toHaveBeenCalledTimes(1);
        }) 
        test("It should return a 401 error code (user not logged in)", async () => {
            const clearCart =jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).delete(baseURL + "/carts/current");

            expect(response.status).toBe(401);
            expect(clearCart).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).not.toHaveBeenCalled();
        })
        test("It should return a 401 error code (user is not a customer)", async () => {
            const clearCart =jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            
            const response = await request(app).delete(baseURL + "/carts/current");

            expect(response.status).toBe(401);
            expect(clearCart).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        })
        test("It should return an error", async () => {
            const clearCart =jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new Error("Error"));
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).delete(baseURL + "/carts/current");

            expect(response.status).not.toBe(200);
            expect(clearCart).toHaveBeenCalledTimes(1);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(customer).toHaveBeenCalledTimes(1);
        })
    })

    describe("DELETE /carts", () => {
        test("It should return a 200 success code", async () => {
            const deleteAllCarts =jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const adminOrManager= jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).delete(baseURL + "/carts");

            expect(response.status).toBe(200);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(adminOrManager).toHaveBeenCalledTimes(1);
            expect(deleteAllCarts).toHaveBeenCalledTimes(1);
        }) 
        test("It should return a 401 error code (user not logged in)", async () => {
            const deleteAllCarts =jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            const adminOrManager= jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).delete(baseURL + "/carts");

            expect(response.status).toBe(401);
            expect(deleteAllCarts).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(adminOrManager).not.toHaveBeenCalled();
        })
        test("It should return a 401 error code (user is not a manager or admin)", async () => {
            const deleteAllCarts =jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const adminOrManager= jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            
            const response = await request(app).delete(baseURL + "/carts");

            expect(response.status).toBe(new UserNotAdminError().customCode);
            expect(deleteAllCarts).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(adminOrManager).toHaveBeenCalledTimes(1);
        })
        test("It should return an error", async () => {
            const deleteAllCarts =jest.spyOn(CartController.prototype, "deleteAllCarts").mockRejectedValueOnce(new Error("Error"));
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const adminOrManager= jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).delete(baseURL + "/carts");

            expect(response.status).not.toBe(200);
            expect(deleteAllCarts).toHaveBeenCalledTimes(1);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(adminOrManager).toHaveBeenCalledTimes(1);
        })
    })

    describe("GET /carts/all", () => {
        test("It should return a 200 success code", async () => {
            const getAllCarts =jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce([testPaidCart1,testPaidCart2,testCart3,testUnpaidCart1]);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const adminOrManager= jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).get(baseURL + "/carts/all");

            expect(response.status).toBe(200);
            expect(response.body).toEqual([testPaidCart1,testPaidCart2,testCart3,testUnpaidCart1]);

            expect(getAllCarts).toHaveBeenCalledTimes(1);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(adminOrManager).toHaveBeenCalledTimes(1);
        }) 
        test("It should return a 401 error code (user not logged in)", async () => {
            const getAllCarts =jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce([testPaidCart1,testPaidCart2,testCart3,testUnpaidCart1]);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            const adminOrManager= jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).get(baseURL + "/carts/all");

            expect(response.status).toBe(401);
            expect(getAllCarts).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(adminOrManager).not.toHaveBeenCalled();
        })
        test("It should return a 401 error code (user is not a manager or admin)", async () => {
            const getAllCarts =jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce([testPaidCart1,testPaidCart2,testCart3,testUnpaidCart1]);
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const adminOrManager= jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => res.status(401).send());

            const response = await request(app).get(baseURL + "/carts/all");

            expect(response.status).toBe(new UserNotManagerError().customCode);
            expect(getAllCarts).not.toHaveBeenCalled();
            expect(logged).toHaveBeenCalledTimes(1);
            expect(adminOrManager).toHaveBeenCalledTimes(1);
        })
        test("It should return an error", async () => {
            const getAllCarts =jest.spyOn(CartController.prototype, "getAllCarts").mockRejectedValueOnce(new Error("Error"));
            const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const adminOrManager= jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => next());

            const response = await request(app).get(baseURL + "/carts/all");

            expect(response.status).not.toBe(200);
            expect(getAllCarts).toHaveBeenCalledTimes(1);
            expect(logged).toHaveBeenCalledTimes(1);
            expect(adminOrManager).toHaveBeenCalledTimes(1);
        })
    })
})