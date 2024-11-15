import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import CartDAO from "../../src/dao/cartDAO"

import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Category, Product } from "../../src/components/product"
import { Role, User } from "../../src/components/user"
import { Cart, ProductInCart } from "../../src/components/cart"
import { cleanup } from "../../src/db/cleanup"
import { ProductNotFoundError } from "../../src/errors/productError"

beforeAll(async() => {
    await cleanup();
    db.serialize(() => {
        db.run(`INSERT INTO carts (id, customer, paid, paymentDate, total) VALUES
                (1, 'frossi', FALSE, NULL, 999.99),
                (2, 'mverdi', TRUE, '2024-05-01', 2799.98),
                (3, 'mverdi', TRUE, '2024-05-10', 1699.97),
                (4, 'mverdi', FALSE, NULL, 0.0),
                (5, 'gconti', FALSE, NULL, 499.99),
                (6, 'lbianchi', TRUE, '2024-04-20', 399.98),
                (7, 'lbianchi', FALSE, NULL, 0.0),
                (8, 'mrossi', TRUE, '2024-04-25', 2499.98),
                (9, 'mrossi', FALSE, NULL, 799.99),
                (10, 'sferrari', FALSE, NULL, 0.0);`);
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
                ('boschWashingMachine', 799.99, 'Appliance', '2023-07-15', 'Bosch 300 Series Front Load Washer', 8, TRUE);`);
        db.run(`INSERT INTO productInCart (model, cartId, quantity) VALUES
                ('iphone14', 1, 1),
                ('galaxyS21', 2, 1),
                ('macbookPro', 2, 1),
                ('iphone14', 3, 1),
                ('ps5', 3, 1),
                ('airpods', 3, 1),
                ('ps5', 5, 1),
                ('airpods', 6, 2),
                ('macbookPro',8,1),
                ('ps5',8,1),
                ('boschWashingMachine',9,1);`);
        db.run(`INSERT INTO users (username, password, salt, role, name, surname, birthdate, address) VALUES
                ('frossi', '', '', 'Customer', 'Francesca', 'Rossi', NULL, NULL),
                ('mverdi', '', '', 'Customer', 'Mario', 'Verdi',  NULL, NULL),   
                ('gconti', '', '', 'Customer', 'Giulia', 'Conti', NULL, NULL),
                ('lbianchi', '', '', 'Customer', 'Luca', 'Bianchi', NULL, NULL),
                ('mrossi', '', '', 'Customer', 'Maria', 'Rossi', NULL, NULL),
                ('sferrari', '', '', 'Customer', 'Sara', 'Ferrari', NULL, NULL),
                ('vrossi', '', '', 'Customer', 'Valeria', 'Rossi', NULL, NULL);`);   
    })
})

describe("Cart DAO-db integration tests", () => {

    describe("getPaidCarts", () => {
        test("No paid carts", async () => {
            const cartDAO = new CartDAO();
            const result = await cartDAO.getPaidCarts('frossi');
            expect(result).toEqual([]);
        })
        test("Should return a cart list", async () => {
            const cartDAO = new CartDAO();
            const result = await cartDAO.getPaidCarts('mverdi');
            expect(result).toEqual([new Cart('mverdi', true, '2024-05-01', 2799.98, [new ProductInCart('galaxyS21', 1, Category.SMARTPHONE, 799.99), new ProductInCart('macbookPro', 1, Category.LAPTOP, 1999.99)]), new Cart('mverdi', true, '2024-05-10', 1699.97, [new ProductInCart('iphone14', 1, Category.SMARTPHONE, 999.99), new ProductInCart('ps5', 1, Category.APPLIANCE, 499.99), new ProductInCart('airpods', 1, Category.SMARTPHONE, 199.99)])]);
        })
    })

    describe("getProduct", () => {
        test("Should return a product", async () => {
            const cartDAO = new CartDAO();
            const result = await cartDAO.getProduct('iphone14');
            expect(result).toEqual(new Product(999.99, 'iphone14', Category.SMARTPHONE, '2023-09-15', 'Apple iPhone 14, 128GB', 50));
        })
        test("Should return a ProductNotFoundError", async () => {
            const cartDAO = new CartDAO();
            await expect(cartDAO.getProduct('cdsafdsf')).rejects.toThrowError(ProductNotFoundError);
        })
    })

    describe("hasCurrCart", () => {
        test("Should return true", async () => {
            const cartDAO = new CartDAO();
            const result = await cartDAO.hasCurrCart('frossi');
            expect(result).toBe(true);
        })
        test("Should return false", async () => {
            const cartDAO = new CartDAO();
            const result = await cartDAO.hasCurrCart('vrossi');
            expect(result).toBe(false);
        })
    })

    

    describe("getCurrCart", () => {
        test("Should return the current cart", async () => {
            const cartDAO = new CartDAO();
            const result = await cartDAO.getCurrCart('frossi');
            expect(result).toEqual(new Cart('frossi', false, null as unknown as string, 999.99, [new ProductInCart('iphone14', 1, Category.SMARTPHONE,999.99)]));
        })
        test("Should return an empty cart", async () => {
            const cartDAO = new CartDAO();
            const result = await cartDAO.getCurrCart('vrossi');
            expect(result).toEqual(new Cart('vrossi', false, null as unknown as string, 0.0, []));
        })
    })

    describe("addEmptyCart", () => {
        test("Should add an empty cart", async () => {
            const cartDAO = new CartDAO();
            await cartDAO.addEmptyCart('vrossi');
            const result = await cartDAO.hasCurrCart('vrossi');
            expect(result).toBe(true);
        })
    })

    describe("getCurrCartId", () => {
        test("Should return the cart id", async () => {
            const cartDAO = new CartDAO();
            const result = await cartDAO.getCurrCartId('frossi');
            expect(result).toBe(1);
        })
    })

    describe("addProductInCart", () => {
        test("Should add a product to the cart", async () => {
            const cartDAO = new CartDAO();
            await cartDAO.addProductInCart('surfacePro', 1);
            const result = await cartDAO.isProductInCart('surfacePro', 1);
            expect(result).toBe(true);
        })
    })

    describe("emptyCart", () => {
        test("Should empty the cart", async () => {
            const cartDAO = new CartDAO();
            await cartDAO.emptyCart(1);
            const result = await cartDAO.isProductInCart('surfacePro', 1);
            expect(result).toBe(false);
        })
    })

    describe("updateQuantity", () => {
        test("Should update the quantity of a product in the cart", async () => {
            const cartDAO = new CartDAO();
            await cartDAO.updateQuantity('ps5', 5, 1);
            const result = await cartDAO.getCurrCart('gconti');
            expect(result).toEqual(new Cart('gconti', false, null as unknown as string, 499.99, [new ProductInCart('ps5', 2, Category.APPLIANCE, 499.99)]));
        })
    })

    describe("updateTotal", () => {
        test("Should update the total of the cart", async () => {
            const cartDAO = new CartDAO();
            await cartDAO.updateTotal(5, 499.99);
            const result = await cartDAO.getCurrCart('gconti');
            expect(result).toEqual(new Cart('gconti', false, null as unknown as string, 999.98, [new ProductInCart('ps5', 2, Category.APPLIANCE, 499.99)]));
        })
    })

    describe("isProductInCart", () => {
        test("Should return true", async () => {
            const cartDAO = new CartDAO();
            const result = await cartDAO.isProductInCart('galaxyS21', 2);
            expect(result).toBe(true);
        })
        test("Should return false", async () => {
            const cartDAO = new CartDAO();
            const result = await cartDAO.isProductInCart('macbookPro', 1);
            expect(result).toBe(false);
        })
    })

    describe("checkoutCart", () => {
        test("Should update the stock of a product", async () => {
            const cartDAO = new CartDAO();

            await cartDAO.updateStock('ps5', 2);
            await cartDAO.setPayment(5, "2024-06-01");
            
            const result1 = await cartDAO.getProduct('ps5');
            expect(result1).toEqual(new Product(499.99, 'ps5', Category.APPLIANCE, '2023-11-15', 'Sony PlayStation 5', 38));
            const result2 = await cartDAO.hasCurrCart('gconti');
            expect(result2).toBe(false);
            const result3 = await cartDAO.getPaidCarts('gconti');
            expect(result3).toEqual([new Cart('gconti', true, '2024-06-01', 999.98, [new ProductInCart('ps5', 2, Category.APPLIANCE, 499.99)])]);
        })
    })

    describe("getCarts", () => {
        test("Should return a list of carts", async () => {
            const cartDAO = new CartDAO();
            const result = await cartDAO.getCarts();
            expect(result).toEqual([new Cart('frossi', false, null as unknown as string, 0, []), 
                                    new Cart('mverdi', true, '2024-05-01', 2799.98, [new ProductInCart('galaxyS21', 1, Category.SMARTPHONE, 799.99), new ProductInCart('macbookPro', 1, Category.LAPTOP, 1999.99)]), 
                                    new Cart('mverdi', true, '2024-05-10', 1699.97, [new ProductInCart('airpods', 1, Category.SMARTPHONE, 199.99), new ProductInCart('iphone14', 1, Category.SMARTPHONE, 999.99), new ProductInCart('ps5', 1, Category.APPLIANCE, 499.99)]), 
                                    new Cart('mverdi', false, null as unknown as string, 0.0, []), 
                                    new Cart('gconti', true, '2024-06-01', 999.98, [new ProductInCart('ps5', 2, Category.APPLIANCE, 499.99)]), 
                                    new Cart('lbianchi', true, '2024-04-20', 399.98, [new ProductInCart('airpods', 2, Category.SMARTPHONE, 199.99)]), 
                                    new Cart('lbianchi', false, null as unknown as string, 0.0, []), 
                                    new Cart('mrossi', true, '2024-04-25', 2499.98, [new ProductInCart('macbookPro', 1, Category.LAPTOP, 1999.99), new ProductInCart('ps5', 1, Category.APPLIANCE, 499.99)]), 
                                    new Cart('mrossi', false, null as unknown as string, 799.99, [new ProductInCart('boschWashingMachine', 1, Category.APPLIANCE, 799.99)]), 
                                    new Cart('sferrari', false, null as unknown as string, 0.0, []),
                                    new Cart('vrossi', false, null as unknown as string, 0.0, [])]);
                            
        });
    })

    describe("deleteCarts", () => {
        test("Should delete all carts", async () => {
            const cartDAO = new CartDAO();
            await cartDAO.deleteCarts();
            const result = await cartDAO.getCarts();
            expect(result).toEqual([]);
        })
    })
})