import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { cleanup } from "../../src/db/cleanup"
import db from "../../src/db/db"

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

beforeAll(async() => {
    await cleanup();
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

describe("Review routes integration tests", () => {

    describe("POST /reviews/:model", () => {
        test("Should return 200 for a valid review", async () => {
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 5, comment: "Great phone" })
                .set('Cookie', customerCookie)
                .expect(200);
            await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(1)
                    expect(res.body[0].score).toBe(5)
                    expect(res.body[0].comment).toBe("Great phone")
                })
        })
        test("Should return 422 for a review with a score greater than 5", async () => {
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 6, comment: "Great phone" })
                .set('Cookie', customerCookie)
                .expect(422)
        })
        test("Should return 422 for a review with a score less than 1", async () => {
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 0, comment: "Great phone" })
                .set('Cookie', customerCookie)
                .expect(422)
        })
        test("Should return 422 for a review with an empty comment", async () => {
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 5, comment: "" })
                .set('Cookie', customerCookie)
                .expect(422)
        })
        test("Should return 401 for a manager trying to post a review", async () => {
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 5, comment: "Great phone" })
                .set('Cookie', managerCookie)
                .expect(401)
        })
        test("Should return 401 for an admin trying to post a review", async () => {
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 5, comment: "Great phone" })
                .set('Cookie', adminCookie)
                .expect(401)
        })
        test("Should return 401 for a user not logged in trying to post a review", async () => {
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 5, comment: "Great phone" })
                .expect(401)
        })
        test("Should return 404 for a review of a non-existing product", async () => {
            await request(app)
                .post(`${routePath}/reviews/nonExistingProduct`)
                .send({ score: 5, comment: "Great phone" })
                .set('Cookie', customerCookie)
                .expect(404)
        })
        test("Should return 409 for a user trying to post a review for a product he has already reviewed", async () => {
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 5, comment: "Great phone" })
                .set('Cookie', customerCookie)
                .expect(409)
        })
    });

    describe("GET /reviews/:model", () => {
        test("Should return 200 for a valid request (Customer)", async () => {
            await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(1)
                    expect(res.body[0].score).toBe(5)
                    expect(res.body[0].comment).toBe("Great phone")
                })
        })
        test("Should return 200 for a valid request (Manager)", async () => {
            await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .set('Cookie', managerCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(1)
                    expect(res.body[0].score).toBe(5)
                    expect(res.body[0].comment).toBe("Great phone")
                })
        })
        test("Should return 200 for a valid request (Admin)", async () => {
            await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .set('Cookie', adminCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(1)
                    expect(res.body[0].score).toBe(5)
                    expect(res.body[0].comment).toBe("Great phone")
                })
        })
        test("Should return 401 for a user not logged in", async () => {
            await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .expect(401)
        })
        test("Should return 200 for a product with no reviews", async () => {
            await request(app)
                .get(`${routePath}/reviews/dellXPS13`)
                .set('Cookie', customerCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(0)
                })
        })
        test("Should return 200 for a non-existing product", async () => {
            await request(app)
                .get(`${routePath}/reviews/nonExistingProduct`)
                .set('Cookie', customerCookie)
                .expect(404)
        })
    });
    describe("DELETE /reviews/:model", () => {
        test("Should return 200 for a valid request", async () => {
            await request(app)
                .delete(`${routePath}/reviews/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(200)
            await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(0)
                })
        })
        test("Should return 401 for a user not logged in", async () => {
            await request(app)
                .delete(`${routePath}/reviews/iPhone14`)
                .expect(401)
        })
        test("Should return 401 for a manager", async () => {
            await request(app)
                .delete(`${routePath}/reviews/iPhone14`)
                .set('Cookie', managerCookie)
                .expect(401)
        })
        test("Should return 401 for an admin", async () => {
            await request(app)
                .delete(`${routePath}/reviews/iPhone14`)
                .set('Cookie', adminCookie)
                .expect(401)
        })
        test("Should return 404 for a non-existing product", async () => {
            await request(app)
                .delete(`${routePath}/reviews/nonExistingProduct`)
                .set('Cookie', customerCookie)
                .expect(404)
        })
        test("Should return 404 if user doesn't have a review for that product", async () => {
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 5, comment: "Great phone" })
                .set('Cookie', customerCookie)
                .expect(200);
            await request(app)
                .delete(`${routePath}/reviews/iPhone14`)
                .set('Cookie', customer2Cookie)
                .expect(404)
        })
    });

    describe("DELETE /reviews/:model/all", () => {
        test("Should return 200 for a valid request (manager)", async () => {
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 2, comment: "Bad phone" })
                .set('Cookie', customer2Cookie)
                .expect(200);
            await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(2)
                })
            await request(app)
                .delete(`${routePath}/reviews/iPhone14/all`)
                .set('Cookie', managerCookie)
                .expect(200)
            await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(0)
                })
        })
        test("Should return 200 for a valid request (admin)", async () => {
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 2, comment: "Bad phone" })
                .set('Cookie', customer2Cookie)
                .expect(200);
            await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(1)
                })
            await request(app)
                .delete(`${routePath}/reviews/iPhone14/all`)
                .set('Cookie', adminCookie)
                .expect(200)
            await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(0)
                })
        })
        test("Should return 401 for a user not logged in", async () => {
            await request(app)
                .delete(`${routePath}/reviews/iPhone14/all`)
                .expect(401)
        })
        test("Should return 401 for a customer", async () => {
            await request(app)
                .delete(`${routePath}/reviews/iPhone14/all`)
                .set('Cookie', customerCookie)
                .expect(401)
        })
        test("Should return 404 for a non-existing product", async () => {
            await request(app)
                .delete(`${routePath}/reviews/nonExistingProduct/all`)
                .set('Cookie', managerCookie)
                .expect(404)
        })
    });
    describe("DELETE /reviews", () => {
        test("Should return 200 for a valid request (Manager)", async () => {
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 2, comment: "Bad phone" })
                .set('Cookie', customer2Cookie)
                .expect(200);
            await request(app)
                .post(`${routePath}/reviews/dellXPS13`)
                .send({ score: 2, comment: "Bad laptop" })
                .set('Cookie', customer2Cookie)
                .expect(200);
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 5, comment: "Good phone" })
                .set('Cookie', customerCookie)
                .expect(200);    
            await request(app)
                .post(`${routePath}/reviews/dellXPS13`)
                .send({ score: 5, comment: "Good phone" })
                .set('Cookie', customerCookie)
                .expect(200);  
            await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(2)
                })
            await request(app)
                .get(`${routePath}/reviews/dellXPS13`)
                .set('Cookie', customer2Cookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(2)
                })

            await request(app)
                .delete(`${routePath}/reviews`)
                .set('Cookie', managerCookie)
                .expect(200)
            await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(0)
                })
            await request(app)
                .get(`${routePath}/reviews/dellXPS13`)
                .set('Cookie', customer2Cookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(0)
                })
        })
        test("Should return 200 for a valid request (Admin)", async () => {
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 2, comment: "Bad phone" })
                .set('Cookie', customer2Cookie)
                .expect(200);
            await request(app)
                .post(`${routePath}/reviews/dellXPS13`)
                .send({ score: 2, comment: "Bad laptop" })
                .set('Cookie', customer2Cookie)
                .expect(200);
            await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .send({ score: 5, comment: "Good phone" })
                .set('Cookie', customerCookie)
                .expect(200);    
            await request(app)
                .post(`${routePath}/reviews/dellXPS13`)
                .send({ score: 5, comment: "Good phone" })
                .set('Cookie', customerCookie)
                .expect(200);  

            await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(2)
                })
            await request(app)
                .get(`${routePath}/reviews/dellXPS13`)
                .set('Cookie', customer2Cookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(2)
                })

            await request(app)
                .delete(`${routePath}/reviews`)
                .set('Cookie', adminCookie)
                .expect(200)
            await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .set('Cookie', customerCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(0)
                })
            await request(app)
                .get(`${routePath}/reviews/dellXPS13`)
                .set('Cookie', customer2Cookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveLength(0)
                })
        })

        test("Should return 401 for a user not logged in", async () => {
            await request(app)
                .delete(`${routePath}/reviews`)
                .expect(401)
        })
        test("Should return 401 for a customer", async () => {
            await request(app)
                .delete(`${routePath}/reviews`)
                .set('Cookie', customerCookie)
                .expect(401)
        })

    });
});
