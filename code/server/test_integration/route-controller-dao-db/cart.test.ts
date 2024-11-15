import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { cleanup } from "../../src/db/cleanup"
import { beforeEach, run } from "node:test"
import db from "../../src/db/db"
import {Category, Product} from "../../src/components/product"
import { User } from "../../src/components/user"

const routePath = "/ezelectronics" 

const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const customer2 = { username: "customer2", name: "customer2", surname: "customer2", password: "customer2", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }

let customerCookie: string
let customer2Cookie: string
let adminCookie: string
let managerCookie: string

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}
/*const postProduct = async (product: any) => {
    await request(app)
        .post(`${routePath}/products`)
        .send(product)
        .set('Cookie', adminCookie)
        .expect(200)
}*/

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

beforeAll(async () => {
    await cleanup();
    /*db.run(`INSERT INTO users (username, name, surname, password, role) VALUES 
            ('admin', 'admin', 'admin', 'admin', 'Admin'),
            ('manager', 'manager', 'manager', 'manager', 'Manager'),
            ('customer', 'customer', 'customer', 'customer', 'Customer')`);*/ 
    await postUser(customer)
    await postUser(admin)
    await postUser(manager)
    await postUser(customer2)
    customerCookie = await login(customer)
    customer2Cookie = await login(customer2)
    adminCookie = await login(admin)
    managerCookie = await login(manager)
    /*await postProduct(new Product(999.99,"iPhone14", Category.SMARTPHONE, "2022-01-01", "", 10))
    await postProduct(new Product(1299.99,"dellXPS13", Category.LAPTOP, "2022-01-01","", 0))*/
    db.run(`INSERT INTO products (sellingPrice, model, category, arrivalDate, details, quantity, visible) VALUES
            (999.99, 'iPhone14', 'Smartphone', '2022-01-01', '', 4, true),
            (1299.99, 'dellXPS13', 'Laptop', '2022-01-01', '', 0, true)`);
})

describe("Cart routes integration tests", () => {
    describe("POST /carts", () => {
        test("Expect 200 success code and cart insertion", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .send({ model: "iPhone14", quantity: 1 })
                .set('Cookie', customerCookie)
                .expect(200)
        })
        test("Expect 401 unauthorized code (admin)", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', adminCookie)
                .expect(401)
        })
        test("Expect 401 unauthorized code (manager)", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', managerCookie)
                .expect(401)
        })
        test("Expect 401 unauthorized code (not logged in)", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .expect(401)
        })
        test("Expect 404 error", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .send({ model: "iPhone20", quantity: 1 })
                .set('Cookie', customerCookie)
                .expect(404)
        })
        test("Expect 409 error", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .send({ model: "dellXPS13"})
                .set('Cookie', customerCookie)
                .expect(409)
        })
    });

    describe("GET /carts", () => {
        test("Expect 200 success code and the cart", async () => {
            const cart=await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            expect(cart.body.products.length).toBe(1)
            expect(cart.body.total).toBe(999.99)
            expect(cart.body.products[0].model).toBe('iPhone14')
            expect(cart.body.products[0].quantity).toBe(1)
            expect(cart.body.products[0].price).toBe(999.99)
            expect(cart.body.customer).toBe('customer')
            expect(cart.body.paymentDate).toBeNull()
            expect(cart.body.paid).toBe(false)
        })
        test("Expect 401 unauthorized code (admin)", async () => {
            await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', adminCookie)
                .expect(401)
        })
        test("Expect 401 unauthorized code (manager)", async () => {
            await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', managerCookie)
                .expect(401)
        })
        test("Expect 401 unauthorized code (not logged in)", async () => {
            await request(app)
                .get(`${routePath}/carts`)
                .expect(401)
        })
        test("Expect 200 success code and empty cart", async () => {
            const cart=await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customer2Cookie)
                .expect(200)
            expect(cart.body.products.length).toBe(0)
            expect(cart.body.total).toBe(0)
            expect(cart.body.customer).toBe('customer2')
            expect(cart.body.paymentDate).toBeNull()
            expect(cart.body.paid).toBe(false)
        })

    });

    describe("PATCH /carts", () => {
        test("Expect 200 success code and cart checkout", async () => {
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            const currentCart=await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)

            expect(currentCart.body.products.length).toBe(0)
            expect(currentCart.body.total).toBe(0)

            const carts=await request(app)
                .get(`${routePath}/carts/history`)
                .set('Cookie', customerCookie)
                .expect(200)
            const cart=carts.body[0]
            expect(cart.products.length).toBe(1)
            expect(cart.total).toBe(999.99)
            expect(cart.products[0].model).toBe('iPhone14')
            expect(cart.products[0].quantity).toBe(1)
            expect(cart.products[0].price).toBe(999.99)
            expect(cart.customer).toBe('customer')
            expect(cart.paymentDate).not.toBeNull()
            expect(cart.paid).toBe(true)

            const products=await request(app)
                .get(`${routePath}/products`)
                .set('Cookie', adminCookie)
                .expect(200)
            const product=products.body.filter((p: any) => p.model==='iPhone14')
            expect(product[0].quantity).toBe(3)
        })
        test("Expect 401 unauthorized code (admin)", async () => {
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', adminCookie)
                .expect(401)
        })
        test("Expect 401 unauthorized code (manager)", async () => {
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', managerCookie)
                .expect(401)
        })
        test("Expect 401 unauthorized code (not logged in)", async () => {
            await request(app)
                .patch(`${routePath}/carts`)
                .expect(401)
        })
        test("Expect 404 error", async () => {
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customer2Cookie)
                .expect(404)
        })
        test("Expect 400 error", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .send({ model: "iPhone14"})
                .set('Cookie', customerCookie)
                .expect(200);
            await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(200);
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(400)
        })
        test("Expect 409 error", async () => {
            for (let i=0; i<4; i++){
                await request(app)
                    .post(`${routePath}/carts`)
                    .send({ model: "iPhone14"})
                    .set('Cookie', customerCookie)
                    .expect(200);
            }
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(409)
            await request(app)
                .delete(`${routePath}/carts/current`)
                .set('Cookie', customerCookie)
                .expect(200)
        })
    });

    describe("GET /carts/history", () => {
        test("Expect 200 success code and the cart history", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .send({ model: "iPhone14"})
                .set('Cookie', customerCookie)
                .expect(200)
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            await request(app)
                .post(`${routePath}/carts`)
                .send({ model: "iPhone14"})
                .set('Cookie', customerCookie)
                .expect(200)
            const carts=await request(app)
                .get(`${routePath}/carts/history`)
                .set('Cookie', customerCookie)
                .expect(200)
            expect(carts.body.length).toBe(2)
            const cart=carts.body[0]
            expect(cart.products.length).toBe(1)
            expect(cart.total).toBe(999.99)
            expect(cart.products[0].model).toBe('iPhone14')
            expect(cart.products[0].quantity).toBe(1)
            expect(cart.products[0].price).toBe(999.99)
            expect(cart.customer).toBe('customer')
            expect(cart.paymentDate).not.toBeNull()
            expect(cart.paid).toBe(true)

            const cart2=carts.body[1]
            expect(cart2.products.length).toBe(1)
            expect(cart2.total).toBe(999.99)
            expect(cart2.products[0].model).toBe('iPhone14')
            expect(cart2.products[0].quantity).toBe(1)
            expect(cart2.products[0].price).toBe(999.99)
            expect(cart2.customer).toBe('customer')
            expect(cart2.paymentDate).not.toBeNull()
            expect(cart2.paid).not.toBe(false)
        })
        test("Expect 401 unauthorized code (admin)", async () => {
            await request(app)
                .get(`${routePath}/carts/history`)
                .set('Cookie', adminCookie)
                .expect(401)
        })
        test("Expect 401 unauthorized code (manager)", async () => {
            await request(app)
                .get(`${routePath}/carts/history`)
                .set('Cookie', managerCookie)
                .expect(401)
        })
        test("Expect 401 unauthorized code (not logged in)", async () => {
            await request(app)
                .get(`${routePath}/carts/history`)
                .expect(401)
        })
    });

    describe("DELETE /carts/current", () => {
        test("Expect 200 success code and cart deletion", async () => {
            await request(app)
                .delete(`${routePath}/carts/current`)
                .set('Cookie', customerCookie)
                .expect(200)
            const cart=await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            expect(cart.body.products.length).toBe(0)
            expect(cart.body.total).toBe(0)
        })
        test("Expect 401 unauthorized code (admin)", async () => {
            await request(app)
                .delete(`${routePath}/carts/current`)
                .set('Cookie', adminCookie)
                .expect(401)
        })
        test("Expect 401 unauthorized code (manager)", async () => {
            await request(app)
                .delete(`${routePath}/carts/current`)
                .set('Cookie', managerCookie)
                .expect(401)
        })
        test("Expect 401 unauthorized code (not logged in)", async () => {
            await request(app)
                .delete(`${routePath}/carts/current`)
                .expect(401)
        })
        test("Expect 404 error", async () => {
            await request(app)
                .delete(`${routePath}/carts/current`)
                .set('Cookie', customer2Cookie)
                .expect(404)

        })
    });

    describe("DELETE /carts/products/:model", () => {
        test("Expect 200 success code and product deletion", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .send({ model: "iPhone14"})
                .set('Cookie', customerCookie)
                .expect(200)
            await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(200)
            const cart=await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            expect(cart.body.products.length).toBe(0)
            expect(cart.body.total).toBe(0)
        })
        test("Expect 401 unauthorized code (admin)", async () => {
            await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .set('Cookie', adminCookie)
                .expect(401)
        })
        test("Expect 401 unauthorized code (manager)", async () => {
            await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .set('Cookie', managerCookie)
                .expect(401)
        })
        test("Expect 401 unauthorized code (not logged in)", async () => {
            await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .expect(401)
        })
        test("Expect 404 error (product not in cart)", async () => {
            await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(404)
        })
        test("Expect 404 error (product that doesn't exist)", async () => {
            await request(app)
                .delete(`${routePath}/carts/products/iPhone20`)
                .set('Cookie', customerCookie)
                .expect(404)
        })
        test("Expect 404 error (no current cart)", async () => {
            await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .set('Cookie', customer2Cookie)
                .expect(404)
        })
    });

    describe("GET /carts/all", () => {
        test("Expect 200 success code and all carts", async () => {
            const carts=await request(app)
                .get(`${routePath}/carts/all`)
                .set('Cookie', adminCookie)
                .expect(200)

            expect(carts.body.length).toBe(3)
            const cart=carts.body[0]
            expect(cart.products.length).toBe(1)
            expect(cart.total).toBe(999.99)
            expect(cart.products[0].model).toBe('iPhone14')
            expect(cart.products[0].quantity).toBe(1)
            expect(cart.products[0].price).toBe(999.99)
            expect(cart.customer).toBe('customer')
            expect(cart.paymentDate).not.toBeNull()
            expect(cart.paid).toBe(true)

            const cart2=carts.body[1]
            expect(cart2.products.length).toBe(1)
            expect(cart2.total).toBe(999.99)
            expect(cart2.products[0].model).toBe('iPhone14')
            expect(cart2.products[0].quantity).toBe(1)
            expect(cart2.products[0].price).toBe(999.99)
            expect(cart2.customer).toBe('customer')
            expect(cart2.paymentDate).not.toBeNull()
            expect(cart2.paid).not.toBe(false)

            const cart3=carts.body[2]
            expect(cart3.products.length).toBe(0)
            expect(cart3.total).toBe(0)
            expect(cart3.customer).toBe('customer')
        })
        test("Expect 401 unauthorized code (customer)", async () => {
            await request(app)
                .get(`${routePath}/carts/all`)
                .set('Cookie', customerCookie)
                .expect(401)
        })
        test("Expect 401 unauthorized code (not logged in)", async () => {
            await request(app)
                .get(`${routePath}/carts/all`)
                .expect(401)
        })
    });

    describe("DELETE /carts", () => {
        test("Expect 200 success code and all carts deletion", async () => {
            await request(app)
                .delete(`${routePath}/carts`)
                .set('Cookie', adminCookie)
                .expect(200)
            const carts=await request(app)
                .get(`${routePath}/carts/all`)
                .set('Cookie', adminCookie)
                .expect(200)
            await request(app)
                .get(`${routePath}/carts/all`)
                .set('Cookie', managerCookie)
                .expect(200)
            expect(carts.body.length).toBe(0)
        })
        test("Expect 401 unauthorized code (customer)", async () => {
            await request(app)
                .delete(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(401)
        })

        test("Expect 401 unauthorized code (not logged in)", async () => {
            await request(app)
                .delete(`${routePath}/carts`)
                .expect(401)
        })
    });
});