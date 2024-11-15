import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { cleanup } from "../../src/db/cleanup"
import { Category, Product } from "../../src/components/product"


const routePath = "/ezelectronics"

const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const product1= { model: "iphone11", category: Category.SMARTPHONE, quantity: 10, details: "iphone11 256GB", sellingPrice: 700, arrivalDate: "2023-01-01" }
const product2= { model: "galaxyS10", category: Category.SMARTPHONE, quantity: 5, details: "galaxyS10 128GB", sellingPrice: 500, arrivalDate: "2023-02-01" }
const product3= { model: "asus rog", category: Category.LAPTOP, quantity: 10, details: "asus rog 16GB RAM, 512GB SSD", sellingPrice: 1500, arrivalDate: "2023-03-01" }
const product4= { model: "iphone14", category: Category.SMARTPHONE, quantity: 10, details: "iphone14 256GB", sellingPrice: 800, arrivalDate: "2023-04-01" }

let customerCookie: string
let adminCookie: string

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

const postProduct = async (productInfo: any) => {
    await request(app)
        .post(`${routePath}/products`)
        .set('Cookie', adminCookie)
        .send(productInfo)
        .expect(200)
}

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
    await cleanup()
    await postUser(customer)
    await postUser(admin)
    adminCookie = await login(admin)
    await postProduct(product1)
    await postProduct(product2)
    await postProduct(product3)
    await postProduct(product4)
    
})

describe("Product routes integration tests", () => {

    describe("GET /products", () => {

        test("Should return all products", async () => {
            const res = await request(app)
                .get(`${routePath}/products`)
                .set('Cookie', adminCookie)
                .expect(200)
            expect(res.body).toEqual([product1, product2, product3, product4])
        })

        test("Should return all products filtered by category", async () => {
            const res = await request(app)
                .get(`${routePath}/products?grouping=category&category=Smartphone`)
                .set('Cookie', adminCookie)
                .expect(200)
            expect(res.body).toEqual([product1, product2, product4])
        })

        test("Should return the product with the specified model", async () => {
            const res = await request(app)
                .get(`${routePath}/products?grouping=model&model=iphone11`)
                .set('Cookie', adminCookie)
                .expect(200)
            expect(res.body).toEqual([product1])
        })

        test("It should return a 404 error if the product does not exist", async () => {
            await request(app).get(`${routePath}/products?grouping=model&model=iphone15`).set('Cookie', adminCookie).expect(404)
        })

        test("It should return a 422 error if at least one request query is invalid", async () => {
            await request(app).get(`${routePath}/products?grouping=category&category=Smartphone&model=iphone14`).set('Cookie', adminCookie).expect(422)
            await request(app).get(`${routePath}/products?grouping=category`).set('Cookie', adminCookie).expect(422)
            await request(app).get(`${routePath}/products?category=Smarphone`).set('Cookie', adminCookie).expect(422)
            await request(app).get(`${routePath}/products?grouping=Invalid`).set('Cookie', adminCookie).expect(422)
            await request(app).get(`${routePath}/products?grouping=category&category=Invalid`).set('Cookie', adminCookie).expect(422)
        })

        test("It should return a 401 error if the user is not logged in, Admin or Manager", async () => { 
            await request(app).get(`${routePath}/products`).expect(401)
            customerCookie = await login(customer)
            await request(app).get(`${routePath}/products`).set('Cookie', customerCookie).expect(401)
        })
    })

    describe("POST /products", () => {

        test("Should add a new product", async () => {
            const newProduct = { model: "iphone12", category: Category.SMARTPHONE, quantity: 10, details: "iphone12 256GB", sellingPrice: 750, arrivalDate: "2023-05-01" }
            await request(app).post(`${routePath}/products`).set('Cookie', adminCookie).send(newProduct).expect(200)

            const res = await request(app).get(`${routePath}/products`).set('Cookie', adminCookie).expect(200)
            expect(res.body).toContainEqual(newProduct)
        })

        test("Should return a 422 error if at least one request body parameter is empty/missing", async () => {
            await request(app).post(`${routePath}/products`).set('Cookie', adminCookie).send({ model: "", category: Category.SMARTPHONE, quantity: 10, details: "iphone12 256GB", sellingPrice: 750, arrivalDate: "2023-05-01" }).expect(422)
            await request(app).post(`${routePath}/products`).set('Cookie', adminCookie).send({ model: "iphone12", category: "", quantity: 10, details: "iphone12 256GB", sellingPrice: 750, arrivalDate: "2023-05-01" }).expect(422)
            await request(app).post(`${routePath}/products`).set('Cookie', adminCookie).send({ model: "iphone12", category: Category.SMARTPHONE, quantity: 0, details: "iphone12 256GB", sellingPrice: 750, arrivalDate: "2023-05-01" }).expect(422)
            await request(app).post(`${routePath}/products`).set('Cookie', adminCookie).send({ model: "iphone12", category: Category.SMARTPHONE, quantity: 10, details: "iphone12 256GB", sellingPrice: "", arrivalDate: "2023-05-01" }).expect(422)
            await request(app).post(`${routePath}/products`).set('Cookie', adminCookie).send({ model: "iphone12", category: Category.SMARTPHONE, quantity: 10, details: "iphone12 256GB", sellingPrice: 750, arrivalDate: "date" }).expect(422)
        })

        test("Should return a 409 error if the product already exist", async () => {
            await request(app).post(`${routePath}/products`).set('Cookie', adminCookie).send(product1).expect(409)
        })

        test("It should return a 401 error if the user is not logged in, Admin or Manager", async () => { 
            await request(app).post(`${routePath}/products`).send(product1).expect(401)
            customerCookie = await login(customer)
            await request(app).post(`${routePath}/products`).set('Cookie', customerCookie).send(product1).expect(401)
        })

        test("It should return a 400 error if arrivalDate is after the current date", async () => {
            const newProduct = { model: "iphone18", category: Category.SMARTPHONE, quantity: 10, details: "iphone18 256GB", sellingPrice: 750, arrivalDate: "2028-05-01" }
            await request(app).post(`${routePath}/products`).set('Cookie', adminCookie).send(newProduct).expect(400)
        })
    })

    describe("PATCH /products/:model", () => {

        test("Should increase the quantity of the product", async () => {
            const res = await request(app).patch(`${routePath}/products/iphone11`).set('Cookie', adminCookie).send({ quantity: 5 }).expect(200)
            expect(res.body).toEqual({quantity: 15})
        })

        test("Should return a 422 error if the request body parameter is empty/missing", async () => {
            await request(app).patch(`${routePath}/products/iphone11`).set('Cookie', adminCookie).send({ quantity: "" }).expect(422)
            await request(app).patch(`${routePath}/products/iphone11`).set('Cookie', adminCookie).send({ quantity: 0 }).expect(422)
            await request(app).patch(`${routePath}/products/iphone11`).set('Cookie', adminCookie).send({ quantity: 5, changeDate: "date" }).expect(422)
        })

        test("Should return a 401 error if the user is not logged in, Admin or Manager", async () => {
            await request(app).patch(`${routePath}/products/iphone11`).send({ quantity: 5 }).expect(401)
            customerCookie = await login(customer)
            await request(app).patch(`${routePath}/products/iphone11`).set('Cookie', customerCookie).send({ quantity: 5 }).expect(401)
        })

        test("Should return a 404 error if the product does not exist", async () => {
            await request(app).patch(`${routePath}/products/iphone15`).set('Cookie', adminCookie).send({ quantity: 5 }).expect(404)
        })

        test("Should return a 400 error if changeDate is after the current date or before the arrival date", async () => {
            await request(app).patch(`${routePath}/products/iphone11`).set('Cookie', adminCookie).send({ quantity: 5, changeDate: "2025-01-01" }).expect(400)
            await request(app).patch(`${routePath}/products/iphone11`).set('Cookie', adminCookie).send({ quantity: 5, changeDate: "2022-01-01" }).expect(400)
        })
    })

    describe("PATCH /products/:model/sell", () => {

        test("Should decrease the quantity of the product", async () => {
            const res = await request(app).patch(`${routePath}/products/iphone11/sell`).set('Cookie', adminCookie).send({ quantity: 15 }).expect(200)
            expect(res.body).toEqual({quantity: 0})
        })

        test("Should return a 404 error if the product does not exist", async () => {
            await request(app).patch(`${routePath}/products/iphone15/sell`).set('Cookie', adminCookie).send({ quantity: 5 }).expect(404)
        })

        test("Should return a 400 error if sellingDate is after the current date or before the arrival date", async () => {
            await request(app).patch(`${routePath}/products/iphone11/sell`).set('Cookie', adminCookie).send({ quantity: 5, sellingDate: "2025-01-01" }).expect(400)
            await request(app).patch(`${routePath}/products/iphone11/sell`).set('Cookie', adminCookie).send({ quantity: 5, sellingDate: "2022-01-01" }).expect(400)
        })

        test("Should return a 422 error if the request body parameter is empty/missing", async () => {
            await request(app).patch(`${routePath}/products/iphone11/sell`).set('Cookie', adminCookie).send({ quantity: "" }).expect(422)
            await request(app).patch(`${routePath}/products/iphone11/sell`).set('Cookie', adminCookie).send({ quantity: 0 }).expect(422)
            await request(app).patch(`${routePath}/products/iphone11/sell`).set('Cookie', adminCookie).send({ quantity: 5, sellingDate: "date" }).expect(422)
        })

        test("Should return a 409 error if the product is out of stock or the product quantity is lower than the requested quantity", async () => {
            await request(app).patch(`${routePath}/products/iphone11/sell`).set('Cookie', adminCookie).send({ quantity: 20 }).expect(409)
            await request(app).patch(`${routePath}/products/iphone11/sell`).set('Cookie', adminCookie).send({ quantity: 5 }).expect(409)
        })

        test("Should return a 401 error if the user is not logged in, Admin or Manager", async () => {
            await request(app).patch(`${routePath}/products/iphone11/sell`).send({ quantity: 5 }).expect(401)
            customerCookie = await login(customer)
            await request(app).patch(`${routePath}/products/iphone11/sell`).set('Cookie', customerCookie).send({ quantity: 5 }).expect(401)
        })
    })


    describe("GET /products/available", () => {

        test("Should return all available products", async () => {
            const res = await request(app)
                .get(`${routePath}/products/available`)
                .set('Cookie', adminCookie)
                .expect(200)
            expect(res.body).toEqual([product2, product3, product4, { model: "iphone12", category: Category.SMARTPHONE, quantity: 10, details: "iphone12 256GB", sellingPrice: 750, arrivalDate: "2023-05-01" }])
        })

        test("Should return all available products filtered by category", async () => {
            const res = await request(app)
                .get(`${routePath}/products/available?grouping=category&category=Smartphone`)
                .set('Cookie', adminCookie)
                .expect(200)
            expect(res.body).toEqual([product2, product4, { model: "iphone12", category: Category.SMARTPHONE, quantity: 10, details: "iphone12 256GB", sellingPrice: 750, arrivalDate: "2023-05-01" }])
        })

        test("Should return the available product with the specified model", async () => {
            const res = await request(app)
                .get(`${routePath}/products/available?grouping=model&model=asus rog`)
                .set('Cookie', adminCookie)
                .expect(200)
            expect(res.body).toEqual([product3])
        })

        test("It should return a 404 if the product does not exist", async () => {
            await request(app).get(`${routePath}/products/available?grouping=model&model=iphone15`).set('Cookie', adminCookie).expect(404)
        })

        test("It should return a 422 if at least one request query is invalid", async () => {
            await request(app).get(`${routePath}/products/available?grouping=category&category=Smartphone&model=iphone14`).set('Cookie', adminCookie).expect(422)
            await request(app).get(`${routePath}/products/available?grouping=category`).set('Cookie', adminCookie).expect(422)
            await request(app).get(`${routePath}/products/available?category=Smarphone`).set('Cookie', adminCookie).expect(422)
            await request(app).get(`${routePath}/products/available?grouping=Invalid`).set('Cookie', adminCookie).expect(422)
            await request(app).get(`${routePath}/products/available?grouping=category&category=Invalid`).set('Cookie', adminCookie).expect(422)
        })

        test("It should return a 401 if the user is not logged in", async () => {
            await request(app).get(`${routePath}/products/available`).expect(401)
            })
    })

    describe("DELETE /products/:model", () => {

        test("Should delete the product", async () => {
            await request(app).delete(`${routePath}/products/iphone11`).set('Cookie', adminCookie).expect(200)
            const res = await request(app).get(`${routePath}/products`).set('Cookie', adminCookie).expect(200)
            expect(res.body).not.toContainEqual(product1)
        })

        test("It should return a 401 error if the user is not logged in, Admin or Manager", async () => {
            await request(app).delete(`${routePath}/products/iphone11`).expect(401)
            customerCookie = await login(customer)
            await request(app).delete(`${routePath}/products/iphone11`).set('Cookie', customerCookie).expect(401)
        })

        test("It should return a 404 error if the product does not exist", async () => {
            await request(app).delete(`${routePath}/products/iphone11`).set('Cookie', adminCookie).expect(404)
        })
    })

    describe("DELETE /products", () => {

        test("Should delete all products", async () => {
            await request(app).delete(`${routePath}/products`).set('Cookie', adminCookie).expect(200)
            const res = await request(app).get(`${routePath}/products`).set('Cookie', adminCookie).expect(200)
            expect(res.body).toEqual([])
        })

        test("It should return a 401 error if the user is not logged in, Admin or Manager", async () => {
            await request(app).delete(`${routePath}/products`).expect(401)
            customerCookie = await login(customer)
            await request(app).delete(`${routePath}/products`).set('Cookie', customerCookie).expect(401)
        })
    })
})
