import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { cleanup } from "../../src/db/cleanup"
import { Role, User } from "../../src/components/user"
import db from "../../src/db/db"

const routePath = "/ezelectronics"

const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const customer2 = { username: "customer2", name: "customer2", surname: "customer2", password: "customer2", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const admin2 = { username: "admin2", name: "admin2", surname: "admin2", password: "admin2", role: "Admin" }

let customerCookie: string
let adminCookie: string

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

beforeAll(async () => {
    await cleanup()
    await postUser(admin)
    adminCookie = await login(admin)
})


describe("User routes integration tests", () => {
    describe("POST /users", () => {
        test("It should return a 200 success code and create a new user", async () => {
            await request(app)
                .post(`${routePath}/users`)
                .send(customer)
                .expect(200)

            const users = await request(app) 
                .get(`${routePath}/users`)
                .set("Cookie", adminCookie) 
                .expect(200)
            expect(users.body).toHaveLength(2) 
            let cust = users.body.find((user: any) => user.username === customer.username) 
            expect(cust).toBeDefined() 
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
        })

        test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
            await request(app)
                .post(`${routePath}/users`)
                .send({username: "test", password: ""})
                .expect(422)
        })

        test("It should return a 409 error code if username already exists", async () => {
            await request(app)
                .post(`${routePath}/users`)
                .send(customer)
                .expect(409)
        })
    })

    describe("POST /sessions", () => {
        test("It should log in a user and return it", async () => {
            const user = await request(app)
                .post(`${routePath}/sessions`)
                .send(customer)
                .expect(200)
            expect(user.body.name).toBe(customer.name)
            expect(user.body.surname).toBe(customer.surname)
            expect(user.body.role).toBe(customer.role)
        })

        test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
            await request(app)
                .post(`${routePath}/sessions`)
                .send({ username: "", name: "test", surname: "test", password: "test", role: "Customer" })
                .expect(422)
        })

        test("It should return a 401 error code if username or password are wrong", async () => {
            await request(app)
                .post(`${routePath}/sessions`)
                .send({ username: "wrong", name: "test", surname: "test", password: "wrong", role: "Customer" })
                .expect(401)
        })
    })

    describe("GET /sessions/current", () => {
        test("It should return the logged in user", async () => {
            const user = await request(app).get(`${routePath}/sessions/current`).set("Cookie", adminCookie).expect(200)
            expect(user.body.name).toBe(admin.name)
            expect(user.body.surname).toBe(admin.surname)
            expect(user.body.role).toBe(admin.role)
        })

        test("It should return a 401 error code if the user is not logged in", async () => {
            await request(app).get(`${routePath}/sessions/current`).set("Cookie", "").expect(401)
        })
    })

    describe("GET /users", () => {
        test("It should return an array of users", async () => {
            const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
            expect(users.body).toHaveLength(2)
            let cust = users.body.find((user: any) => user.username === customer.username)
            expect(cust).toBeDefined()
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
            let adm = users.body.find((user: any) => user.username === admin.username)
            expect(adm).toBeDefined()
            expect(adm.name).toBe(admin.name)
            expect(adm.surname).toBe(admin.surname)
            expect(adm.role).toBe(admin.role)
        })

        test("It should return a 401 error code if the user is not an Admin", async () => {
            customerCookie = await login(customer)
            await request(app).get(`${routePath}/users`).set("Cookie", customerCookie).expect(401)
        })
    })

    describe("DELETE /sessions/current", () => {
        test("It should log out a user", async () => {
            const user = await request(app)
                .delete(`${routePath}/sessions/current`)
                .set("Cookie", customerCookie)
                .send(customer)
                .expect(200)
            await request(app).get(`${routePath}/users/${customer.username}`).set("Cookie", customerCookie).expect(401)
        })

        test("It should return a 401 error code if the user is not logged in", async () => {
            await request(app).delete(`${routePath}/sessions/current`).set("Cookie", "").expect(401)
        })
    })

    describe("GET /users/roles/:role", () => {
        test("It should return an array of users with a specific role", async () => {
            const admins = await request(app).get(`${routePath}/users/roles/Admin`).set("Cookie", adminCookie).expect(200)
            expect(admins.body).toHaveLength(1)
            let adm = admins.body[0]
            expect(adm.username).toBe(admin.username)
            expect(adm.name).toBe(admin.name)
            expect(adm.surname).toBe(admin.surname)
        })

        test("It should fail if the role is not valid", async () => {
            await request(app).get(`${routePath}/users/roles/Invalid`).set("Cookie", adminCookie).expect(422)
        })

        test("It should return a 401 error code if the user is not an Admin", async () => {
            customerCookie = await login(customer)
            await request(app).get(`${routePath}/users/roles/Admin`).set("Cookie", customerCookie).expect(401)
        })
    })

    describe("GET /users/:username", () => {
        test("It should return a user with a specific username", async () => {
            const user = await request(app).get(`${routePath}/users/${customer.username}`).set("Cookie", adminCookie).expect(200)
            let custom = user.body
            expect(custom.username).toBe(custom.username)
            expect(custom.name).toBe(custom.name)
            expect(custom.surname).toBe(custom.surname)
        })

        test("It should return a 401 error code if the user is not logged in", async () => {
            await request(app).get(`${routePath}/users/${customer.username}`).set("Cookie", "").expect(401)
        })

        test("It should return a 404 error code if the user does not exist", async () => {
            await request(app).get(`${routePath}/users/wrong`).set("Cookie", adminCookie).expect(404)
        })

        test("It should return a 401 error code if user (no Admin) is not the logged one", async () => {
            await postUser(customer2)
            await request(app).get(`${routePath}/users/${customer2.username}`).set("Cookie", customerCookie).expect(401)
        })
    })

    describe("PATCH /users/:username", () => {
        test("It should update a specific user info and return it", async () => {
            const user = await request(app).patch(`${routePath}/users/${customer.username}`)
                .set("Cookie", customerCookie)
                .send({name: "new_name", surname: "new_surname", address: "new_address", birthdate: "2000-01-01"})
                .expect(200)
            const users = await request(app) 
                .get(`${routePath}/users`)
                .set("Cookie", adminCookie) 
                .expect(200)
            let cust = users.body.find((user: any) => user.username === customer.username)  
            expect(cust.name).toBe("new_name")
            expect(cust.surname).toBe("new_surname")
            expect(cust.address).toBe("new_address")
            expect(cust.birthdate).toBe("2000-01-01")
        })

        test("It should return a 401 error code if the user is not logged in", async () => {
            await request(app).patch(`${routePath}/users/${customer.username}`).set("Cookie", "").expect(401)
        })

        test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
            await request(app)
                .patch(`${routePath}/users/${customer.username}`)
                .set("Cookie", customerCookie)
                .send({name: "", surname: "new_surname", address: "new_address", birthdate: "2000-01-01"})
                .expect(422)
        })

        test("It should return a 400 error code if date is invalid", async () => {
            await request(app)
                .patch(`${routePath}/users/${customer.username}`)
                .set("Cookie", customerCookie)
                .send({name: "new_name", surname: "new_surname", address: "new_address", birthdate: "2100-01-01"})
                .expect(400)
        })

        test("It should return a 404 error code if the user does not exist", async () => {
            await request(app)
                .patch(`${routePath}/users/wrong`)
                .set("Cookie", customerCookie)
                .send({name: "new_name", surname: "new_surname", address: "new_address", birthdate: "2000-01-01"})
                .expect(404)
        })

        test("It should return a 401 error code if user is not the logged one", async () => {
            await request(app)
                .patch(`${routePath}/users/${customer2.username}`)
                .set("Cookie", customerCookie)
                .send({name: "new_name", surname: "new_surname", address: "new_address", birthdate: "2000-01-01"})
                .expect(401)
        })
    })

    describe("DELETE /users/:username", () => {
        test("It should return a 200 success code and delete a specific user", async () => {
            await request(app).delete(`${routePath}/users/${customer.username}`).set("Cookie", adminCookie).expect(200)

            const users = await request(app) 
                .get(`${routePath}/users`)
                .set("Cookie", adminCookie) 
                .expect(200)
            expect(users.body).toHaveLength(2) 
            let cust = users.body.find((user: any) => user.username === customer.username) 
            expect(cust).not.toBeDefined()
        })

        test("It should return a 401 error code if the user is not logged in", async () => {
            await request(app).delete(`${routePath}/users/${customer.username}`).set("Cookie", "").expect(401)
        })

        test("It should return a 404 error code if the user does not exist", async () => {
            await request(app).delete(`${routePath}/users/wrong`).set("Cookie", adminCookie).expect(404)
        })

        test("It should return a 401 error code if user (no Admin) is not the logged one", async () => {
            await request(app).delete(`${routePath}/users/${customer2.username}`).set("Cookie", customerCookie).expect(401)
        })

        test("It should return a 401 error code if an Admin wants to delete another Admin", async () => {
            await postUser(admin2)
            await request(app).delete(`${routePath}/users/${admin2.username}`).set("Cookie", adminCookie).expect(401)
        })
    })

    describe("DELETE /users", () => {
        test("It should return a 200 success code and delete all users", async () => {
            await request(app).delete(`${routePath}/users`).set("Cookie", adminCookie).expect(200)

            const users = await request(app) 
                .get(`${routePath}/users`)
                .set("Cookie", adminCookie) 
                .expect(200)
            expect(users.body).toHaveLength(2)
            let adm = users.body[0]
            expect(adm.username).toBe(admin.username)
            expect(adm.name).toBe(admin.name)
            expect(adm.surname).toBe(admin.surname)

            let adm2 = users.body[1]
            expect(adm2.username).toBe(admin2.username)
            expect(adm2.name).toBe(admin2.name)
            expect(adm2.surname).toBe(admin2.surname)
        })

        test("It should return a 401 error code if the user is not an Admin", async () => {
            await request(app).delete(`${routePath}/users`).set("Cookie", customerCookie).expect(401)
        })
    })
})
