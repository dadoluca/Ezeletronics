import { User } from "../components/user";
import { Cart, ProductInCart } from "../components/cart";
import { Category, Product } from "../components/product";
import db from "../db/db";
import { ProductNotFoundError } from "../errors/productError";

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {

    getPaidCarts(user: string): Promise<Cart[]>{
        return new Promise((resolve,reject) => {
            const sql = "SELECT C.id, C.paymentDate, C.total, PC.model, PC.quantity, P.category, P.sellingPrice FROM carts as C, productInCart as PC, products as P WHERE C.paid = TRUE AND C.customer = ? AND C.id = PC.cartId AND P.model = PC.model";
            db.all(sql, [user], (err: Error, rows: any) => {
                if (err) reject(err);

                let carts: Cart[] = [];
                let cartsId: number[] = [];
                let i: number;
                rows.forEach((r: { id: number, paymentDate: string, total: number, model: string, quantity: number, category: Category, sellingPrice: number }) => {
                    i = cartsId.findIndex((c) => c === r.id);
                    if( i != -1 ) carts[i].products.push(new ProductInCart(r.model, r.quantity, r.category, r.sellingPrice));
                    else {
                        cartsId.push(r.id);
                        carts.push(new Cart(user, true, r.paymentDate, r.total, [new ProductInCart(r.model, r.quantity, r.category, r.sellingPrice)]));
                    }
                })

                resolve(carts);
            })
        })
    }

    getProduct(model: string): Promise<Product>{
        return new Promise((resolve,reject) => {
            const sql = "SELECT * FROM products WHERE model = ? AND visible = true";
            db.get(sql, [model], (err: Error, row: any) => {
                if (err) reject(err);
                row ? resolve(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity)) : reject(new ProductNotFoundError)
            })
        })
    }

    hasCurrCart(user: string): Promise<boolean>{
        return new Promise((resolve,reject) => {
            const sql = "SELECT * FROM carts WHERE customer = ? AND paid = FALSE";
            db.get(sql, [user], (err: Error, row: any) => {
                if (err) reject(err);
                row ? resolve(true) : resolve(false)
            })
        })
    }

    addEmptyCart(user: string): Promise<void>{
        return new Promise((resolve,reject) => {
            const sql = "INSERT INTO carts(id, customer, paid, paymentDate, total) VALUES(?, ?, ?, ?, ?)";
            db.run(sql, [null, user, false, null, 0.0], (err: Error) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    getCurrCart(user: string): Promise<Cart>{
        return new Promise((resolve,reject) => {
            const sql = "SELECT PC.model, PC.quantity, P.category, P.sellingPrice, C.total FROM carts as C, productInCart as PC, products as P WHERE C.paid = FALSE AND C.customer = ? AND C.id = PC.cartId AND P.model = PC.model";
            db.all(sql, [user], (err: Error, rows: any) => {
                if (err) reject(err);
                if(rows.length === 0) resolve(new Cart(user, false, null, 0.0, []));
                else {
                    let products: ProductInCart[] = rows.map((r: { model: string, quantity: number, category: Category, sellingPrice: number, total: number }) => new ProductInCart(r.model, r.quantity, r.category, r.sellingPrice));

                    resolve(new Cart(user, false, null, rows[0].total, products));
                }
            })
        })
    }

    getCurrCartId(user: string): Promise<number>{
        return new Promise((resolve,reject) => {
            const sql = "SELECT id FROM carts WHERE paid = FALSE AND customer = ?";
            db.get(sql, [user], (err: Error, row: any) => {
                if (err) reject(err);
                resolve(row.id);
            })
        })
    }

    addProductInCart(product: string, cartId: number): Promise<void>{
        return new Promise((resolve,reject) => {
            const sql = "INSERT INTO productInCart(model, cartId, quantity) VALUES(?, ?, 1)";
            db.run(sql, [product, cartId], (err: Error) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    emptyCart(cartId: number): Promise<void>{
        return new Promise((resolve,reject) => {
            const sql1 = "DELETE FROM productInCart WHERE cartId = ?";
            db.run(sql1, [cartId], (err: Error) => {
                if (err) reject(err);
            })

            const sql2 = "UPDATE carts SET total = 0 WHERE id = ?";
            db.run(sql2, [cartId], (err: Error) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    updateQuantity(product: string, cartId: number, quantity: number): Promise<void>{
        return new Promise((resolve,reject) => {
            const sql = "UPDATE productInCart SET quantity = quantity + ? WHERE model = ? AND cartId = ?";
            db.run(sql, [quantity, product, cartId], (err: Error) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    updateTotal(cartId: number, productPrice: number): Promise<void>{
        return new Promise((resolve,reject) => {
            const sql = "UPDATE carts SET total = ROUND(total + ?, 2) WHERE id = ?";
            db.run(sql, [productPrice, cartId], (err: Error) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    isProductInCart(product: string, cartId: number): Promise<boolean>{
        return new Promise((resolve,reject) => {
            const sql = "SELECT * FROM productInCart WHERE model = ? AND cartId = ?";
            db.get(sql, [product, cartId], (err: Error, row: any) => {
                if (err) reject(err);
                row ? resolve(true) : resolve(false)
            })
        })
    }

    updateStock(product: string, sold: number): Promise<void>{
        return new Promise((resolve,reject) => {
            const sql = "UPDATE products SET quantity = quantity - ? WHERE model = ?";
            db.run(sql, [sold, product], (err: Error) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    setPayment(cartId: number, date: string): Promise<void>{
        return new Promise((resolve,reject) => {
            const sql = "UPDATE carts SET paymentDate = ?, paid = TRUE WHERE id = ?";
            db.run(sql, [date, cartId], (err: Error) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    deleteCarts(): Promise<void>{
        return new Promise((resolve,reject) => {
            const sql = "DELETE FROM carts";
            db.run(sql, [], (err: Error) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    getCarts(): Promise<Cart[]>{
        return new Promise((resolve,reject) => {
            const sql = "SELECT C.id, C.customer, C.paymentDate, C.total, PC.model, PC.quantity, P.category, P.sellingPrice, C.paid FROM carts as C LEFT JOIN productInCart as PC ON C.id = PC.cartId LEFT JOIN products as P ON P.model = PC.model";
            db.all(sql, [], (err: Error, rows: any) => {
                if (err) reject(err);

                let carts: Cart[] = [];
                let cartsId: number[] = [];
                let i: number;
                rows.forEach((r: {id: number, customer: string, paymentDate: string, total: number, model: string, quantity: number, category: Category, sellingPrice: number, paid: boolean }) => {
                    i = cartsId.findIndex((c) => c === r.id);
                    if( i != -1 ) {
                        carts[i].products.push(new ProductInCart(r.model, r.quantity, r.category, r.sellingPrice));
                    } else {
                        cartsId.push(r.id);
                        let cart = new Cart(r.customer, !!r.paid, r.paymentDate, r.total, []);
                        if (r.model != null) cart.products.push(new ProductInCart(r.model, r.quantity, r.category, r.sellingPrice));
                        carts.push(cart);
                    }
                })
                resolve(carts);
            })
        })
    }

}

export default CartDAO