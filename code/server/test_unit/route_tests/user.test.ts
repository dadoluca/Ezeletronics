import { test, expect, jest, afterEach, describe } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import UserController from "../../src/controllers/userController"
import { Role, User } from "../../src/components/user"
import Authenticator from "../../src/routers/auth"
import express from "express"
import ErrorHandler from "../../src/helper"
import { UserAlreadyExistsError } from "../../src/errors/userError"
const baseURL = "/ezelectronics"

jest.mock("../../src/controllers/userController");
jest.mock("../../src/routers/auth");

const testCustom = new User("customer", "cust_name", "cust_surname", Role.CUSTOMER, "", "");
const testCustom2 = new User("customer2", "cust2_name", "cust2_surname", Role.CUSTOMER, "", "");
const testMan = new User("manager", "man_name", "man_surname", Role.MANAGER, "", "");
const testAdmin = new User("admin", "ad_name", "ad_surname", Role.ADMIN, "", "");
const testAdmin2 = new User("admin2", "ad2_name", "ad2_surname", Role.ADMIN, "", "");

const mockIsString = () => ({ isLength: () => ({}) });
const mockNotEmpty = () => ({ isLength: () => ({}) });
const mockIsDate = () => ({ isLength: () => ({}) });

describe("User routes unit tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    })

    describe("POST /users", () => {
        //The test checks if the route returns a 200 success code
        //The test also expects the createUser method of the controller to be called once with the correct parameters
        afterEach(() => {
            jest.clearAllMocks();
            jest.restoreAllMocks();
        })
        test("It should return a 200 success code", async () => {
            const testUser = { //Define a test user object sent to the route
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }
            jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
            expect(response.status).toBe(200) //Check if the response status is 200
            expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
            //Check if the createUser method has been called with the correct parameters
            expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role)
        })

        test("It should return a 422 error code (invalid body)", async () => {
            const testUser = {
                username: "",
                name: "",
                surname: "",
                password: "",
                role: ""
            }
            jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => {
                    throw new Error("Error")
                }),
            }))
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "Validation error" });
            })
            const response = await request(app).post(baseURL + "/users").send(testUser)
            expect(response.status).toBe(422)
            expect(UserController.prototype.createUser).not.toHaveBeenCalled()
        })

        test("It should return an error", async () => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }
            
            jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new UserAlreadyExistsError())

            await request(app).post(baseURL + "/users").send(testUser)
            const response = await request(app).post(baseURL + "/users").send(testUser)
            expect(response.status).toBe(new UserAlreadyExistsError().customCode)
            expect(UserController.prototype.createUser).toHaveBeenCalledTimes(2)
        })
    })

    describe("GET /users", () => {
        test("It should return an array of all users", async () => {
            const userList = [testCustom, testCustom2, testMan, testAdmin, testAdmin2];
    
            const getUsers = jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(userList);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            const isAdmin = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req: any, res: any, next: any) => next());
    
            const response = await request(app).get(baseURL + "/users");
    
            expect(response.status).toBe(200);
            expect(response.body).toEqual(userList);
    
            expect(getUsers).toHaveBeenCalledTimes(1);
            expect(isAdmin).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
        })

        test("It should return an error", async () => {
            const getUsers = jest.spyOn(UserController.prototype, "getUsers").mockRejectedValueOnce(new Error("Error"));
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            const isAdmin = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req: any, res: any, next: any) => next());
            
            const response = await request(app).get(baseURL + "/users");

            expect(response.status).not.toBe(200);
            expect(getUsers).toHaveBeenCalledTimes(1);
            expect(isAdmin).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
        })

        test("It should return a 401 error code (user is not an admin)", async () => {
            const userList = [testCustom, testCustom2, testMan, testAdmin, testAdmin2];
    
            const getUsers = jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(userList);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            const isAdmin = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
    
            const response = await request(app).get(baseURL + "/users");
    
            expect(response.status).toBe(401);
    
            expect(getUsers).not.toHaveBeenCalled();
            expect(isAdmin).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
        })
    })

    describe("GET /users/roles/:role", () => {
        test("It should return an array of users with a specific role", async () => {
            const userList = [testCustom, testCustom2];
    
            const getUsers = jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(userList);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            const isAdmin = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req: any, res: any, next: any) => next());
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            const response = await request(app).get(baseURL + "/users/roles/" + testCustom.role);
    
            expect(response.status).toBe(200);
            expect(response.body).toEqual(userList);
    
            expect(getUsers).toHaveBeenCalledTimes(1);
            expect(isAdmin).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith(testCustom.role);
        })

        test("It should return an error", async () => {
            const getUsers =jest.spyOn(UserController.prototype, "getUsersByRole").mockRejectedValueOnce(new Error("Error"));
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            const isAdmin = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req: any, res: any, next: any) => next());
            
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            
            const response = await request(app).get(baseURL + "/users/roles/" + testCustom.role);

            expect(response.status).not.toBe(200);
            expect(getUsers).toHaveBeenCalledTimes(1);
            expect(isAdmin).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith(testCustom.role);
        })

        test("It should return a 401 error code (user is not an admin)", async () => {
            const userList = [testCustom, testCustom2];
    
            const getUsers = jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(userList);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            const isAdmin = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            const response = await request(app).get(baseURL + "/users/roles/" + testCustom.role);
    
            expect(response.status).toBe(401);
    
            expect(getUsers).not.toHaveBeenCalled();
            expect(isAdmin).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
        })

        /*test("It should return a 422 error code (invalid role)", async () => {
            const userList = [testCustom, testCustom2];
    
            const getUsers = jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(userList);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const isAdmin = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req: any, res: any, next: any) => next());
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Error")
                }),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "Validation error" });
            })

            const response = await request(app).get(baseURL + "/users/roles/wrong_role");
    
            expect(response.status).toBe(422);
    
            expect(getUsers).not.toHaveBeenCalled();
            expect(isAdmin).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
        })*/
    })

    describe("GET /users/:username", () => {
        test("It should return the user with a specific username", async () => {
            const getUser = jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testCustom);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            const response = await request(app).get(baseURL + "/users/" + testCustom.username);
    
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testCustom);
    
            expect(getUser).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledWith(testCustom, testCustom.username);
        })

        test("It should return an error", async () => {
            const getUser = jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValueOnce(new Error("Error"));
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            
            const response = await request(app).get(baseURL + "/users/" + testCustom.role);

            expect(response.status).not.toBe(200);
            expect(getUser).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
        })

        test("It should return a 401 error code (user is not logged in)", async () => {
            const getUser = jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testCustom);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            const response = await request(app).get(baseURL + "/users/" + testCustom.username);
    
            expect(response.status).toBe(401);
    
            expect(getUser).not.toHaveBeenCalled();
            expect(isLogged).toHaveBeenCalledTimes(1);
        })

        /*test("It should return a 422 error code (invalid username)", async () => {
            const getUser = jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testCustom);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Error")
                }),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "Validation error" });
            })

            const response = await request(app).get(baseURL + "/users/");
    
            expect(response.status).toBe(422);
    
            expect(getUser).not.toHaveBeenCalled();
            expect(isLogged).toHaveBeenCalledTimes(1);
        })*/
    })

    describe("DELETE /users/:username", () => {
        test("It should return a 200 success code", async () => {
            const del = jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            const response = await request(app).delete(baseURL + "/users/" + testCustom.username);
    
            expect(response.status).toBe(200);
    
            expect(del).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
            expect(del).toHaveBeenCalledWith(testCustom, testCustom.username);
        })

        test("It should return an error", async () => {
            const del = jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new Error("Error"));
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            
            const response = await request(app).delete(baseURL + "/users/" + testCustom.username);

            expect(response.status).not.toBe(200);
            expect(del).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
            expect(del).toHaveBeenCalledWith(testCustom, testCustom.username);
        })

        test("It should return a 401 error code (user is not logged in)", async () => {
            const del = jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            const response = await request(app).delete(baseURL + "/users/" + testCustom.username);
    
            expect(response.status).toBe(401);
    
            expect(del).not.toHaveBeenCalled();
            expect(isLogged).toHaveBeenCalledTimes(1);
        })

        /*test("It should return a 422 error code (invalid username)", async () => {
            const del = jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Error")
                }),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "Validation error" });
            })
    
            const response = await request(app).delete(baseURL + "/users/" + testCustom.username);
    
            expect(response.status).toBe(422);
    
            expect(del).not.toHaveBeenCalled();
            expect(isLogged).toHaveBeenCalledTimes(1);
        })*/
    })

    describe("DELETE /users", () => {
        test("It should return a 200 success code", async () => {
            const del = jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            const isAdmin = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req: any, res: any, next: any) => next());

            const response = await request(app).delete(baseURL + "/users/");

            expect(response.status).toBe(200);
    
            expect(del).toHaveBeenCalledTimes(1);
            expect(isAdmin).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
        })

        test("It should return an error", async () => {
            const del = jest.spyOn(UserController.prototype, "deleteAll").mockRejectedValueOnce(new Error("Error"));
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            const isAdmin = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req: any, res: any, next: any) => next());

            const response = await request(app).delete(baseURL + "/users/");

            expect(response.status).not.toBe(200);
    
            expect(del).toHaveBeenCalledTimes(1);
            expect(isAdmin).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
        })

        test("It should return a 401 error code (user is not an admin)", async () => {
            const del = jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            const isAdmin = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req: any, res: any, next: any) => res.status(401).send());

            const response = await request(app).delete(baseURL + "/users/");

            expect(response.status).toBe(401);
    
            expect(del).not.toHaveBeenCalled();
            expect(isAdmin).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
        })
    })

    describe("PATCH /users/:username", () => {
        test("It should return the updated user", async () => {
            const newCustom = new User(testCustom.username, "new_name", "new_surname", Role.CUSTOMER, "new_address", "2000-01-01");
            const update = jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(newCustom);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            const newData = {
                name: "new_name",
                surname: "new_surname",
                address: "new_address",
                birthdate: "2000-01-01"
            }

            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                })),
                body: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                    isDate: mockIsDate,
                })),
            }))
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/users/" + testCustom.username).send(newData);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(newCustom);

            expect(update).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
            expect(update).toHaveBeenCalledWith(testCustom, newCustom.name, newCustom.surname, newCustom.address, newCustom.birthdate, testCustom.username);
        })

        test("It should return an error", async () => {
            const newCustom = new User(testCustom.username, "new_name", "new_surname", Role.CUSTOMER, "new_address", "2000-01-01");
            const update = jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new Error("Error"));
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            const newData = {
                name: "new_name",
                surname: "new_surname",
                address: "new_address",
                birthdate: "2000-01-01"
            }

            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                })),
                body: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                    isDate: mockIsDate,
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/users/" + testCustom.username).send(newData);

            expect(response.status).not.toBe(200);

            expect(update).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
            expect(update).toHaveBeenCalledWith(testCustom, newCustom.name, newCustom.surname, newCustom.address, newCustom.birthdate, testCustom.username);
        })

        test("It should return a 401 error code (user is not logged in)", async () => {
            const newCustom = new User(testCustom.username, "new_name", "new_surname", Role.CUSTOMER, "new_address", "new_birthdate");
            const update = jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(newCustom);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
            const newData = {
                name: "new_name",
                surname: "new_surname",
                address: "new_address",
                birthdate: "new_birthdate"
            }

            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                })),
                body: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                    isDate: mockIsDate,
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/users/" + testCustom.username).send(newData);

            expect(response.status).toBe(401);

            expect(update).not.toHaveBeenCalled();
            expect(isLogged).toHaveBeenCalledTimes(1);
        })

        test("It should return a 422 error code (invalid body)", async () => {
            const newCustom = new User(testCustom.username, "new_name", "new_surname", Role.CUSTOMER, "new_address", "new_birthdate");
            const update = jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(newCustom);
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});
            const newData = {
                name: "",
                surname: "",
                address: "",
                birthdate: ""
            }

            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                })),
                body: jest.fn().mockImplementation(() => {
                    throw new Error("Error")
                }),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "Validation error" });
            })

            const response = await request(app).patch(baseURL + "/users/" + testCustom.username).send(newData);

            expect(response.status).toBe(422);

            expect(update).not.toHaveBeenCalled();
            expect(isLogged).toHaveBeenCalledTimes(1);
        })
    })

    describe("POST /sessions", () => {
        test("It should return the logged in user", async () => {
            const login = jest.spyOn(Authenticator.prototype, "login").mockResolvedValue(testCustom);
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).post(baseURL + "/sessions").send({username: testCustom.username, password: "password"});
            
            expect(response.status).toBe(200);
            expect(login).toHaveBeenCalledTimes(1);
        })

        test("It should return a 422 error code (invalid body)", async () => {
            const login = jest.spyOn(Authenticator.prototype, "login").mockResolvedValue(testCustom);
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => {
                    throw new Error("Error")
                }),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "Validation error" });
            })

            const response = await request(app).post(baseURL + "/sessions").send({username: testCustom.username, password: ""});
            
            expect(response.status).toBe(422);
            expect(login).not.toHaveBeenCalled();
        })

        test("It should return an error", async () => {
            const login = jest.spyOn(Authenticator.prototype, "login").mockRejectedValue(new Error("Error"));
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: mockIsString,
                    notEmpty: mockNotEmpty,
                })),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).post(baseURL + "/sessions").send({username: testCustom.username, password: "password"});

            expect(response.status).not.toBe(200);
            expect(login).toHaveBeenCalledTimes(1);
        })
    })

    describe("DELETE /sessions/current", () => {
        test("It should return a 200 status code", async () => {
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const logout = jest.spyOn(Authenticator.prototype, "logout").mockResolvedValue(null);

            const response = await request(app).delete(baseURL + "/sessions/current");

            expect(response.status).toBe(200);
            expect(logout).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
        })

        test("It should return an error", async () => {
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
            const logout = jest.spyOn(Authenticator.prototype, "logout").mockRejectedValue(new Error("Error"));

            const response = await request(app).delete(baseURL + "/sessions/current");

            expect(response.status).not.toBe(200);
            expect(logout).toHaveBeenCalledTimes(1);
            expect(isLogged).toHaveBeenCalledTimes(1);
        })
    })

    describe("GET /sessions/current", () => {
        test("It should return the logged user", async () => {
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {req.user = testCustom; next();});

            const response = await request(app).get(baseURL + "/sessions/current");
            expect(response.status).toBe(200);
            expect(isLogged).toHaveBeenCalledTimes(1);
        })

        test("It should return a 401 error code (user is not logged in)", async () => {
            const isLogged = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());

            const response = await request(app).get(baseURL + "/sessions/current");
            expect(response.status).toBe(401);
            expect(isLogged).toHaveBeenCalledTimes(1);
        })
    })
})
