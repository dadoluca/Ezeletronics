import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import CartController from "../../src/controllers/cartController"
import { Role, User } from "../../src/components/user";
import { Cart, ProductInCart } from "../../src/components/cart";
import { Category, Product } from "../../src/components/product";
import CartDAO from "../../src/dao/cartDAO";
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../../src/errors/productError";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError";
import dayjs from "dayjs";
import e from "express";
import { mock } from "node:test";


jest.mock("../../src/dao/cartDAO");

let testUserCustomer = new User("cust","cust_name","cust_surname",Role.CUSTOMER,"","");
let testUserManager = new User("man","man_name","man_surname",Role.MANAGER,"","");
let testUserAdmin = new User("admin","admin_name","admin_surname",Role.ADMIN,"","");

let testProduct1 = new Product(449.99,"Pixel 7a",Category.SMARTPHONE,"2024-06-01","...",1);
let testProduct2 = new Product(899.99,"MacBook Air",Category.LAPTOP,"2024-05-25","...",0);
let testProduct3 = new Product(499.99,"whirlpoolFridge",Category.APPLIANCE,"2024-05-20","...",5);

let emptyCart = new Cart(testUserCustomer.username,false,"",0,[]);
let testCart1 = new Cart(testUserCustomer.username,false,"",testProduct1.sellingPrice+testProduct3.sellingPrice*2,[new ProductInCart(testProduct1.model,1,testProduct1.category,testProduct1.sellingPrice),new ProductInCart(testProduct3.model,2,testProduct3.category,testProduct3.sellingPrice)]);
let testCart2 = new Cart(testUserCustomer.username,false,"",testProduct1.sellingPrice*10,[new ProductInCart(testProduct1.model,10,testProduct1.category,testProduct1.sellingPrice)]);
let testCart3 = new Cart(testUserCustomer.username,false,"",testProduct2.sellingPrice*0,[new ProductInCart(testProduct2.model,2,testProduct2.category,testProduct2.sellingPrice)]);
let testPaidCart1 = new Cart(testUserCustomer.username,true,"2024-06-01",testProduct1.sellingPrice+testProduct3.sellingPrice*2,[new ProductInCart(testProduct1.model,1,testProduct1.category,testProduct1.sellingPrice),new ProductInCart(testProduct3.model,2,testProduct3.category,testProduct3.sellingPrice)]);
let testPaidCart2 = new Cart(testUserCustomer.username,true,"2024-06-01",testProduct1.sellingPrice*10,[new ProductInCart(testProduct1.model,10,testProduct1.category,testProduct1.sellingPrice)]);
describe("Cart controller unit tests", ()=>{

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks(); 
    });

    describe("addToCart", ()=>{

        test("Should return true (product not already in cart)",async()=>{
            const cartId=1;

            jest.spyOn(CartDAO.prototype, "getProduct").mockResolvedValue(testProduct1);
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockResolvedValue(true);
            jest.spyOn(CartDAO.prototype, "getCurrCartId").mockResolvedValue(cartId);
            jest.spyOn(CartDAO.prototype, "isProductInCart").mockResolvedValue(false);
            jest.spyOn(CartDAO.prototype, "addProductInCart").mockResolvedValue();
            jest.spyOn(CartDAO.prototype, "updateTotal").mockResolvedValue();

            const controller= new CartController();
            const added = await controller.addToCart(testUserCustomer,testProduct1.model);
            expect(added).toBe(true);

            expect(CartDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct1.model);
            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getCurrCartId).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.isProductInCart).toHaveBeenCalledWith(testProduct1.model,cartId);
            expect(CartDAO.prototype.addProductInCart).toHaveBeenCalledWith(testProduct1.model,cartId);
            expect(CartDAO.prototype.updateTotal).toHaveBeenCalledWith(cartId,testProduct1.sellingPrice);

            expect(CartDAO.prototype.getProduct).toBeCalledTimes(1);
            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCurrCartId).toBeCalledTimes(1);
            expect(CartDAO.prototype.isProductInCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.addProductInCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.updateTotal).toBeCalledTimes(1);
            expect(CartDAO.prototype.updateQuantity).not.toHaveBeenCalled();
        })

        test("Should return true (product already in cart)",async()=>{
            let testProduct1 = new Product(449.99,"Pixel 7a",Category.SMARTPHONE,"2024-06-01","...",1);
            let testUserCustomer = new User("cust","cust_name","cust_surname",Role.CUSTOMER,"","");
            const cartId=1;

            jest.spyOn(CartDAO.prototype, "getProduct").mockResolvedValue(testProduct1);
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockResolvedValue(true);
            jest.spyOn(CartDAO.prototype, "getCurrCartId").mockResolvedValue(cartId);
            jest.spyOn(CartDAO.prototype, "isProductInCart").mockResolvedValue(true);
            jest.spyOn(CartDAO.prototype, "updateQuantity").mockResolvedValue();
            jest.spyOn(CartDAO.prototype, "updateTotal").mockResolvedValue();

            const controller= new CartController();
            const added = await controller.addToCart(testUserCustomer,testProduct1.model);
            expect(added).toBe(true);

            expect(CartDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct1.model);
            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getCurrCartId).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.isProductInCart).toHaveBeenCalledWith(testProduct1.model,cartId);
            expect(CartDAO.prototype.updateQuantity).toHaveBeenCalledWith(testProduct1.model,cartId,1);
            expect(CartDAO.prototype.updateTotal).toHaveBeenCalledWith(cartId,testProduct1.sellingPrice);

            expect(CartDAO.prototype.getProduct).toBeCalledTimes(1);
            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCurrCartId).toBeCalledTimes(1);
            expect(CartDAO.prototype.isProductInCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.updateQuantity).toBeCalledTimes(1);
            expect(CartDAO.prototype.updateTotal).toBeCalledTimes(1);

            expect(CartDAO.prototype.addProductInCart).not.toHaveBeenCalled();
            
        })

        test("Should return true (user doesn't have a cart)",async()=>{
            const cartId=1;
            jest.spyOn(CartDAO.prototype, "getProduct").mockResolvedValue(testProduct1);
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockResolvedValue(false);
            jest.spyOn(CartDAO.prototype, "addEmptyCart").mockResolvedValue();
            jest.spyOn(CartDAO.prototype, "getCurrCartId").mockResolvedValue(cartId);
            jest.spyOn(CartDAO.prototype, "isProductInCart").mockResolvedValue(false);
            jest.spyOn(CartDAO.prototype, "addProductInCart").mockResolvedValue();
            jest.spyOn(CartDAO.prototype, "updateTotal").mockResolvedValue();

            const controller= new CartController();
            const added = await controller.addToCart(testUserCustomer,testProduct1.model);
            expect(added).toBe(true);

            expect(CartDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct1.model);
            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.addEmptyCart).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getCurrCartId).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.isProductInCart).toHaveBeenCalledWith(testProduct1.model,cartId);
            expect(CartDAO.prototype.addProductInCart).toHaveBeenCalledWith(testProduct1.model,cartId);
            expect(CartDAO.prototype.updateTotal).toHaveBeenCalledWith(1,testProduct1.sellingPrice);

            expect(CartDAO.prototype.getProduct).toBeCalledTimes(1);
            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.addEmptyCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCurrCartId).toBeCalledTimes(1);
            expect(CartDAO.prototype.isProductInCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.addProductInCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.updateTotal).toBeCalledTimes(1);
            expect(CartDAO.prototype.updateQuantity).not.toHaveBeenCalled();
        })

        test("Should return EmptyProductStockError",async()=>{
            jest.spyOn(CartDAO.prototype, "getProduct").mockResolvedValue(testProduct2);

            const controller= new CartController();
            
            await expect(controller.addToCart(testUserCustomer,testProduct2.model)).rejects.toThrowError(EmptyProductStockError);

            expect(CartDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct2.model);
            expect(CartDAO.prototype.getProduct).toBeCalledTimes(1);
            expect(CartDAO.prototype.hasCurrCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.addEmptyCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.getCurrCartId).not.toHaveBeenCalled();
            expect(CartDAO.prototype.isProductInCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.addProductInCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.updateTotal).not.toHaveBeenCalled();
            expect(CartDAO.prototype.updateQuantity).not.toHaveBeenCalled();
            
        })

        test("Should return ProductNotFoundError",async()=>{
            jest.spyOn(CartDAO.prototype, "getProduct").mockRejectedValue(new ProductNotFoundError);

            const controller= new CartController();
            await expect(controller.addToCart(testUserCustomer,"fafdas")).rejects.toThrowError(ProductNotFoundError);

            expect(CartDAO.prototype.getProduct).toHaveBeenCalledWith("fafdas");
            expect(CartDAO.prototype.getProduct).toBeCalledTimes(1);
            expect(CartDAO.prototype.hasCurrCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.addEmptyCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.getCurrCartId).not.toHaveBeenCalled();
            expect(CartDAO.prototype.isProductInCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.addProductInCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.updateTotal).not.toHaveBeenCalled();
            expect(CartDAO.prototype.updateQuantity).not.toHaveBeenCalled();

        })
        test("Should return an error",async()=>{
            jest.spyOn(CartDAO.prototype, "getProduct").mockRejectedValue(new Error("DAO error"));

            const controller= new CartController();
            await expect(controller.addToCart(testUserCustomer,testProduct1.model)).rejects.toThrow();

            expect(CartDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct1.model);
            expect(CartDAO.prototype.getProduct).toBeCalledTimes(1);
            expect(CartDAO.prototype.hasCurrCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.addEmptyCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.getCurrCartId).not.toHaveBeenCalled();
            expect(CartDAO.prototype.isProductInCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.addProductInCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.updateTotal).not.toHaveBeenCalled();
            expect(CartDAO.prototype.updateQuantity).not.toHaveBeenCalled();
        })
    })

    describe("getCart",()=>{

        test("Should return the cart",async()=>{
            jest.spyOn(CartDAO.prototype, "getCurrCart").mockResolvedValue(testCart1);
            
            const controller= new CartController();
            const cart = await controller.getCart(testUserCustomer);
            expect(cart).toBe(testCart1);

            expect(CartDAO.prototype.getCurrCart).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getCurrCart).toBeCalledTimes(1);
        })

        test("Should return an empty cart",async()=>{
            jest.spyOn(CartDAO.prototype, "getCurrCart").mockResolvedValue(emptyCart);
            
            const controller= new CartController();
            const cart = await controller.getCart(testUserCustomer);
            expect(cart).toBe(emptyCart);

            expect(CartDAO.prototype.getCurrCart).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getCurrCart).toBeCalledTimes(1);
        })

        test("Should return an error",async()=>{
            jest.spyOn(CartDAO.prototype, "getCurrCart").mockRejectedValue(new Error("DAO error"));
            
            const controller= new CartController();
            await expect(controller.getCart(testUserCustomer)).rejects.toThrow();

            expect(CartDAO.prototype.getCurrCart).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getCurrCart).toBeCalledTimes(1);
        })
    })

    describe("checkoutCart",()=>{
        
        test("Should return true",async()=>{
            const cartId=1;
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockResolvedValue(true);
            jest.spyOn(CartDAO.prototype, "getCurrCart").mockResolvedValue(testCart1);
            jest.spyOn(CartDAO.prototype, "getProduct").mockResolvedValueOnce(testProduct1).mockResolvedValueOnce(testProduct3);
            jest.spyOn(CartDAO.prototype, "updateStock").mockResolvedValue();
            jest.spyOn(CartDAO.prototype, "getCurrCartId").mockResolvedValue(cartId);
            jest.spyOn(CartDAO.prototype, "setPayment").mockResolvedValue();

            const controller= new CartController();
            const checkedOut = await controller.checkoutCart(testUserCustomer);
            expect(checkedOut).toBe(true);

            expect(CartDAO.prototype.getCurrCart).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);
            
            expect(CartDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct1.model);
            expect(CartDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct3.model);
            expect(CartDAO.prototype.getProduct).toBeCalledTimes(2);
            
            expect(CartDAO.prototype.updateStock).toHaveBeenCalledWith(testProduct1.model,testCart1.products[0].quantity);
            expect(CartDAO.prototype.updateStock).toHaveBeenCalledWith(testProduct3.model,testCart1.products[1].quantity);
            expect(CartDAO.prototype.updateStock).toBeCalledTimes(2);
            
            expect(CartDAO.prototype.getCurrCartId).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.setPayment).toHaveBeenCalledWith(cartId,dayjs().format('YYYY-MM-DD'));

            expect(CartDAO.prototype.getCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCurrCartId).toBeCalledTimes(1);
            expect(CartDAO.prototype.setPayment).toBeCalledTimes(1);
            

        })

        test("Should return CartNotFoundError",async()=>{
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockResolvedValue(false);

            const controller= new CartController();
            await expect(controller.checkoutCart(testUserCustomer)).rejects.toThrowError(CartNotFoundError);

            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);

            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCurrCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.getProduct).not.toHaveBeenCalled();
            expect(CartDAO.prototype.updateStock).not.toHaveBeenCalled();
            expect(CartDAO.prototype.getCurrCartId).not.toHaveBeenCalled();
            expect(CartDAO.prototype.setPayment).not.toHaveBeenCalled();

        })

        test("Should return EmptyCartError",async()=>{
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockResolvedValue(true);
            jest.spyOn(CartDAO.prototype, "getCurrCart").mockResolvedValue(emptyCart);

            const controller= new CartController();
            await expect(controller.checkoutCart(testUserCustomer)).rejects.toThrowError(EmptyCartError);

            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getCurrCart).toHaveBeenCalledWith(testUserCustomer.username);

            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getProduct).not.toHaveBeenCalled();
            expect(CartDAO.prototype.updateStock).not.toHaveBeenCalled();
            expect(CartDAO.prototype.getCurrCartId).not.toHaveBeenCalled();
            expect(CartDAO.prototype.setPayment).not.toHaveBeenCalled();

        })

        test("Should return EmptyProductStockError",async()=>{
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockResolvedValue(true);
            jest.spyOn(CartDAO.prototype, "getCurrCart").mockResolvedValue(testCart3);
            jest.spyOn(CartDAO.prototype, "getProduct").mockResolvedValue(testProduct2);

            const controller= new CartController();
            await expect(controller.checkoutCart(testUserCustomer)).rejects.toThrowError(EmptyProductStockError);

            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getCurrCart).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct2.model);

            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getProduct).toBeCalledTimes(1);
            expect(CartDAO.prototype.updateStock).not.toHaveBeenCalled();
            expect(CartDAO.prototype.getCurrCartId).not.toHaveBeenCalled();
            expect(CartDAO.prototype.setPayment).not.toHaveBeenCalled();

        })

        test("Should return LowProductStockError",async()=>{
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockResolvedValue(true);
            jest.spyOn(CartDAO.prototype, "getCurrCart").mockResolvedValue(testCart2);
            jest.spyOn(CartDAO.prototype, "getProduct").mockResolvedValue(testProduct1);

            const controller= new CartController();
            await expect(controller.checkoutCart(testUserCustomer)).rejects.toThrowError(LowProductStockError);

            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getCurrCart).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct1.model);

            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getProduct).toBeCalledTimes(1);
            expect(CartDAO.prototype.updateStock).not.toHaveBeenCalled();
            expect(CartDAO.prototype.getCurrCartId).not.toHaveBeenCalled();
            expect(CartDAO.prototype.setPayment).not.toHaveBeenCalled();
        })

        test("Should return an error",async()=>{
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockRejectedValue(new Error("DAO error"));

            const controller= new CartController();
            await expect(controller.checkoutCart(testUserCustomer)).rejects.toThrow();

            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);

            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCurrCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.getProduct).not.toHaveBeenCalled();
            expect(CartDAO.prototype.updateStock).not.toHaveBeenCalled();
            expect(CartDAO.prototype.getCurrCartId).not.toHaveBeenCalled();
            expect(CartDAO.prototype.setPayment).not.toHaveBeenCalled();

        })
    })

    describe("getCustomerCarts",()=>{
        test("Should return the carts",async()=>{
            const cartList=[testPaidCart1,testPaidCart2];
            jest.spyOn(CartDAO.prototype, "getPaidCarts").mockResolvedValue(cartList);
            
            const controller= new CartController();
            const carts = await controller.getCustomerCarts(testUserCustomer);
            expect(carts).toBe(cartList);

            expect(CartDAO.prototype.getPaidCarts).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getPaidCarts).toBeCalledTimes(1);
        })
        test("Should return an empty array",async()=>{
            jest.spyOn(CartDAO.prototype, "getPaidCarts").mockResolvedValue([]);
            
            const controller= new CartController();
            const carts = await controller.getCustomerCarts(testUserCustomer);
            expect(carts).toStrictEqual([]);

            expect(CartDAO.prototype.getPaidCarts).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getPaidCarts).toBeCalledTimes(1);
        })
        
        test("Should return an error",async()=>{
            jest.spyOn(CartDAO.prototype, "getPaidCarts").mockRejectedValue(new Error("DAO error"));
            
            const controller= new CartController();
            await expect(controller.getCustomerCarts(testUserCustomer)).rejects.toThrow();

            expect(CartDAO.prototype.getPaidCarts).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getPaidCarts).toBeCalledTimes(1);
        })
    })

    describe("removeProductFromCart",()=>{
        test("Should return true",async()=>{
            const cartId=1;
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockResolvedValue(true);
            jest.spyOn(CartDAO.prototype, "getProduct").mockResolvedValue(testProduct1);
            jest.spyOn(CartDAO.prototype, "isProductInCart").mockResolvedValue(true);
            jest.spyOn(CartDAO.prototype, "updateTotal").mockResolvedValue();
            jest.spyOn(CartDAO.prototype, "updateQuantity").mockResolvedValue();
            jest.spyOn(CartDAO.prototype, "getCurrCartId").mockResolvedValue(cartId);
        

            const controller= new CartController();
            const removed = await controller.removeProductFromCart(testUserCustomer,testProduct1.model);
            expect(removed).toBe(true);

            expect(CartDAO.prototype.isProductInCart).toHaveBeenCalledWith(testProduct1.model,cartId);
            expect(CartDAO.prototype.updateTotal).toHaveBeenCalledWith(cartId,-testProduct1.sellingPrice);
            expect(CartDAO.prototype.updateQuantity).toHaveBeenCalledWith(testProduct1.model,cartId,-1);
            expect(CartDAO.prototype.getCurrCartId).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct1.model);
            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);

            expect(CartDAO.prototype.isProductInCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.updateTotal).toBeCalledTimes(1);
            expect(CartDAO.prototype.updateQuantity).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCurrCartId).toBeCalledTimes(1);
            expect(CartDAO.prototype.getProduct).toBeCalledTimes(1);
            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);

        })

        test("Should return ProductNotInCartError",async()=>{
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockResolvedValue(true);
            jest.spyOn(CartDAO.prototype, "getCurrCartId").mockResolvedValue(1);
            jest.spyOn(CartDAO.prototype, "getProduct").mockResolvedValue(testProduct1);
            jest.spyOn(CartDAO.prototype, "isProductInCart").mockResolvedValue(false);

            const controller= new CartController();
            await expect(controller.removeProductFromCart(testUserCustomer,testProduct1.model)).rejects.toThrowError(ProductNotInCartError);

            expect(CartDAO.prototype.isProductInCart).toHaveBeenCalledWith(testProduct1.model,1);
            expect(CartDAO.prototype.getCurrCartId).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct1.model);
            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);

            expect(CartDAO.prototype.isProductInCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCurrCartId).toBeCalledTimes(1);
            expect(CartDAO.prototype.getProduct).toBeCalledTimes(1);
            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.updateTotal).not.toHaveBeenCalled();
            expect(CartDAO.prototype.updateQuantity).not.toHaveBeenCalled();

        })

        test("Should return CartNotFoundError",async()=>{
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockResolvedValue(false);

            const controller= new CartController();
            await expect(controller.removeProductFromCart(testUserCustomer,testProduct1.model)).rejects.toThrowError(CartNotFoundError);

            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);

            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.isProductInCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.updateTotal).not.toHaveBeenCalled();
            expect(CartDAO.prototype.updateQuantity).not.toHaveBeenCalled();
            expect(CartDAO.prototype.getCurrCartId).not.toHaveBeenCalled();
            expect(CartDAO.prototype.getProduct).not.toHaveBeenCalled();

        })


        test("Should return an error",async()=>{
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockRejectedValue(new Error("DAO error"));

            const controller= new CartController();
            await expect(controller.removeProductFromCart(testUserCustomer,testProduct1.model)).rejects.toThrow();

            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);

            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getProduct).not.toHaveBeenCalled();
            expect(CartDAO.prototype.isProductInCart).not.toHaveBeenCalled();
            expect(CartDAO.prototype.updateTotal).not.toHaveBeenCalled();
            expect(CartDAO.prototype.updateQuantity).not.toHaveBeenCalled();
            expect(CartDAO.prototype.getCurrCartId).not.toHaveBeenCalled();
        })
    })

    describe("clearCart",()=>{
        test("Should return true",async()=>{
            const cartId=1;
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockResolvedValue(true);
            jest.spyOn(CartDAO.prototype, "getCurrCartId").mockResolvedValue(cartId);
            jest.spyOn(CartDAO.prototype, "emptyCart").mockResolvedValue();

            const controller= new CartController();
            const cleared = await controller.clearCart(testUserCustomer);
            expect(cleared).toBe(true);

            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.getCurrCartId).toHaveBeenCalledWith(testUserCustomer.username);
            expect(CartDAO.prototype.emptyCart).toHaveBeenCalledWith(cartId);

            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCurrCartId).toBeCalledTimes(1);
            expect(CartDAO.prototype.emptyCart).toBeCalledTimes(1);
        })

        test("Should return CartNotFoundError",async()=>{
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockResolvedValue(false);

            const controller= new CartController();
            await expect(controller.clearCart(testUserCustomer)).rejects.toThrowError(CartNotFoundError);

            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);

            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCurrCartId).not.toHaveBeenCalled();
            expect(CartDAO.prototype.emptyCart).not.toHaveBeenCalled();
        })

        test("Should return an error",async()=>{
            jest.spyOn(CartDAO.prototype, "hasCurrCart").mockRejectedValue(new Error("DAO error"));

            const controller= new CartController();
            await expect(controller.clearCart(testUserCustomer)).rejects.toThrow();

            expect(CartDAO.prototype.hasCurrCart).toHaveBeenCalledWith(testUserCustomer.username);

            expect(CartDAO.prototype.hasCurrCart).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCurrCartId).not.toHaveBeenCalled();
            expect(CartDAO.prototype.emptyCart).not.toHaveBeenCalled();
        })
    })

    describe("deleteAllCarts",()=>{
        test("Should return true",async()=>{
            jest.spyOn(CartDAO.prototype, "deleteCarts").mockResolvedValue();

            const controller= new CartController();
            const deleted = await controller.deleteAllCarts();
            expect(deleted).toBe(true);

            expect(CartDAO.prototype.deleteCarts).toBeCalledTimes(1);
        })
        test("Should return an error",async()=>{
            jest.spyOn(CartDAO.prototype, "deleteCarts").mockRejectedValue(new Error("DAO error"));

            const controller= new CartController();
            await expect(controller.deleteAllCarts()).rejects.toThrow();

            expect(CartDAO.prototype.deleteCarts).toBeCalledTimes(1);
        })
    })

    describe("getAllCarts",()=>{
        test("Should return the carts",async()=>{
            const cartList=[testPaidCart1,testPaidCart2];
            jest.spyOn(CartDAO.prototype, "getCarts").mockResolvedValue(cartList);
            
            const controller= new CartController();
            const carts = await controller.getAllCarts();
            expect(carts).toBe(cartList);

            expect(CartDAO.prototype.getCarts).toBeCalledTimes(1);
        })
        test("Should return an empty array",async()=>{
            jest.spyOn(CartDAO.prototype, "getCarts").mockResolvedValue([]);
            
            const controller= new CartController();
            const carts = await controller.getAllCarts();
            expect(carts).toStrictEqual([]);

            expect(CartDAO.prototype.getCarts).toBeCalledTimes(1);
        })
        test("Should return an error",async()=>{
            jest.spyOn(CartDAO.prototype, "getCarts").mockRejectedValue(new Error("DAO error"));

            const controller= new CartController();
            await expect(controller.getAllCarts()).rejects.toThrow();

            expect(CartDAO.prototype.getCarts).toBeCalledTimes(1);
        })
    })
})