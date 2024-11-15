import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"

import { cleanup } from "../../src/db/cleanup"
import db from "../../src/db/db"
import CartController from "../../src/controllers/cartController"
import {Role, User} from "../../src/components/user"
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../../src/errors/productError"
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError"

beforeAll(async() => {
    await cleanup();
    db.serialize(() => {
        db.run(`INSERT INTO products (model, sellingPrice, category, arrivalDate, details, quantity, visible) VALUES
                ('iphone14', 999.99, 'Smartphone', '2023-09-15', 'Apple iPhone 14, 128GB', 50, TRUE),
                ('galaxyS21', 799.99, 'Smartphone', '2023-08-10', 'Samsung Galaxy S21, 256GB', 30, TRUE),
                ('macbookPro', 1999.99, 'Laptop', '2023-07-20', 'Apple MacBook Pro 16"', 2, TRUE),
                ('dellXPS13', 1099.99, 'Laptop', '2023-07-22', 'Dell XPS 13, 16GB RAM, 512GB SSD', 0, TRUE);`);
    
        db.run(`INSERT INTO users (username, password, salt, role, name, surname, birthdate, address) VALUES
                ('frossi', '', '', 'Customer', 'Francesca', 'Rossi', NULL, NULL),
                ('mverdi', '', '', 'Customer', 'Mario', 'Verdi',  NULL, NULL),   
                ('gconti', '', '', 'Customer', 'Giulia', 'Conti', NULL, NULL);`);   
    })
})

describe('Cart Controller-DAO-DB integration tests', () => {
    
    test('Add products to the cart', async () => {
        const cartController = new CartController(); 
        const user=new User('frossi', 'Francesca', 'Rossi', Role.CUSTOMER, null, null);
        await cartController.addToCart(user, 'iphone14');
        await cartController.addToCart(user, 'galaxyS21');
        const cart= await cartController.getCart(user);
        expect(cart.products.length).toBe(2);
        expect(cart.total).toBe(1799.98);
        expect(cart.products[0].model).toBe('iphone14');
        expect(cart.products[0].quantity).toBe(1);
        expect(cart.products[1].model).toBe('galaxyS21');
        expect(cart.products[1].quantity).toBe(1);
    });

    test('Add the same product to the cart', async () => {
        const cartController = new CartController(); 
        const user=new User('frossi', 'Francesca', 'Rossi', Role.CUSTOMER, null, null);
        await cartController.addToCart(user, 'iphone14');
        await cartController.addToCart(user, 'iphone14');
        const cart= await cartController.getCart(user);
        expect(cart.products.length).toBe(2);
        expect(cart.total).toBe(3799.96);
        expect(cart.products[0].model).toBe('iphone14');
        expect(cart.products[0].quantity).toBe(3);
    });

    test('Add a product with no stock to the cart', async () => {
        const cartController = new CartController(); 
        const user=new User('frossi', 'Francesca', 'Rossi', Role.CUSTOMER, null, null);
        await expect(cartController.addToCart(user, 'dellXPS13')).rejects.toThrowError(new EmptyProductStockError());
    });

    test('Checkout the cart', async () => {
        const cartController = new CartController(); 
        const user=new User('frossi', 'Francesca', 'Rossi', Role.CUSTOMER, null, null);
        await cartController.checkoutCart(user);
        const cart= await cartController.getCart(user);
        expect(cart.products.length).toBe(0);
        expect(cart.total).toBe(0);
        const paidCarts= await cartController.getCustomerCarts(user);
        expect(paidCarts.length).toBe(1);
        expect(paidCarts[0].products.length).toBe(2);
        expect(paidCarts[0].total).toBe(3799.96);
        expect(paidCarts[0].products[0].model).toBe('iphone14');
        expect(paidCarts[0].products[0].quantity).toBe(3);
        expect(paidCarts[0].products[1].model).toBe('galaxyS21');
        expect(paidCarts[0].products[1].quantity).toBe(1);
    });

    test('Checkout a non-existing cart', async () => {
        const cartController = new CartController(); 
        const user=new User('mverdi', 'Mario', 'Verdi', Role.CUSTOMER, null, null);
        await expect(cartController.checkoutCart(user)).rejects.toThrowError(new CartNotFoundError());
    });

    test('Checkout an empty cart', async () => {
        const cartController = new CartController(); 
        const user=new User('gconti', 'Giulia', 'Conti', Role.CUSTOMER, null, null);
        await cartController.addToCart(user, 'iphone14');
        await cartController.clearCart(user);
        await expect(cartController.checkoutCart(user)).rejects.toThrowError(new EmptyCartError());
    });

    /*test('Checkout a cart with no stock products', async () => {
        const cartController = new CartController(); 
        const user=new User('gconti', 'Giulia', 'Conti', Role.CUSTOMER, null, null);
        await cartController.addToCart(user, 'dellXPS13');
        await expect(cartController.checkoutCart(user)).rejects.toThrowError(new EmptyProductStockError());
    })*/ // non posso aggiungere un prodotto con stock 0 al carrello

    test('Checkout a cart with product quantity greater than stock', async () => {
        const cartController = new CartController(); 
        const user=new User('gconti', 'Giulia', 'Conti', Role.CUSTOMER, null, null);
        await cartController.addToCart(user, 'macbookPro');
        await cartController.addToCart(user, 'macbookPro');
        await cartController.addToCart(user, 'macbookPro');
        await expect(cartController.checkoutCart(user)).rejects.toThrowError(new LowProductStockError());
    });

    test('Remove a product from the cart', async () => {
        const cartController = new CartController(); 
        const user=new User('frossi', 'Francesca', 'Rossi', Role.CUSTOMER, null, null);
        await cartController.addToCart(user, 'iphone14');
        await cartController.addToCart(user, 'galaxyS21');
        await cartController.removeProductFromCart(user, 'iphone14');
        const cart= await cartController.getCart(user);
        expect(cart.products.length).toBe(1);
        expect(cart.total).toBe(799.99);
        expect(cart.products[0].model).toBe('galaxyS21');
        expect(cart.products[0].quantity).toBe(1);
    });

    test('Remove a non-existing product from the cart', async () => {
        const cartController = new CartController(); 
        const user=new User('frossi', 'Francesca', 'Rossi', Role.CUSTOMER, null, null);
        await expect(cartController.removeProductFromCart(user, 'dadas')).rejects.toThrowError(new ProductNotFoundError);
    });

    test('Remove a product that is not in the cart', async () => {
        const cartController = new CartController(); 
        const user=new User('frossi', 'Francesca', 'Rossi', Role.CUSTOMER, null, null);
        await cartController.addToCart(user, 'iphone14');
        await expect(cartController.removeProductFromCart(user, 'macbookPro')).rejects.toThrowError(new ProductNotInCartError);
    })

    test('Remove a product from an empty cart', async () => {
        const cartController = new CartController(); 
        const user=new User('frossi', 'Francesca', 'Rossi', Role.CUSTOMER, null, null);
        await cartController.clearCart(user);
        await expect(cartController.removeProductFromCart(user, 'iphone14')).rejects.toThrowError(new EmptyCartError);
    });
    
    test('Remove product from a non-existing cart', async () => {
        const cartController = new CartController(); 
        const user=new User('mverdi', 'Mario', 'Verdi', Role.CUSTOMER, null, null);
        await expect(cartController.removeProductFromCart(user, 'iphone14')).rejects.toThrowError(new CartNotFoundError);
    });

    test('Clear cart that does not exist', async () => {
        const cartController = new CartController(); 
        const user=new User('mverdi', 'Mario', 'Verdi', Role.CUSTOMER, null, null);
        await expect(cartController.clearCart(user)).rejects.toThrowError(new CartNotFoundError);
    });

    test('Get all carts', async () => {
        const cartController = new CartController(); 
        const user=new User('frossi', 'Francesca', 'Rossi', Role.CUSTOMER, null, null);
        const carts= await cartController.getAllCarts();
        
        expect(carts.length).toBe(3);

        expect(carts[0].products.length).toBe(2);
        expect(carts[0].total).toBe(3799.96);
        let sortedProducts = carts[0].products.sort((a, b) => a.model.localeCompare(b.model));
        expect(sortedProducts[0].model).toBe('galaxyS21');
        expect(sortedProducts[0].quantity).toBe(1);
        expect(sortedProducts[1].model).toBe('iphone14');
        expect(sortedProducts[1].quantity).toBe(3);
        expect(carts[0].customer).toBe('frossi');
        expect(carts[0].paid).toBe(true);

        expect(carts[1].products.length).toBe(1);
        expect(carts[1].total).toBe(5999.97);
        expect(carts[1].products[0].model).toBe('macbookPro');
        expect(carts[1].products[0].quantity).toBe(3);
        expect(carts[1].customer).toBe('gconti');
        expect(carts[1].paid).toBe(false);

        expect(carts[2].products.length).toBe(0);
        expect(carts[2].total).toBe(0);
        expect(carts[2].customer).toBe('frossi');
        expect(carts[2].paid).toBe(false);

    });

    test('Delete all carts', async () => {
        const cartController = new CartController(); 
        await cartController.deleteAllCarts();
        const carts= await cartController.getAllCarts();
        expect(carts.length).toBe(0);
    });
});
