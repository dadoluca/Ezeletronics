import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"

import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError"
import { Role, User } from "../../src/components/user"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

const testCustom = new User("customer", "cust_name", "cust_surname", Role.CUSTOMER, "", "");
const testCustom2 = new User("customer2", "cust2_name", "cust2_surname", Role.CUSTOMER, "", "");
const testMan = new User("manager", "man_name", "man_surname", Role.MANAGER, "", "");
const testAdmin = new User("admin", "ad_name", "ad_surname", Role.ADMIN, "", "");
const testAdmin2 = new User("admin2", "ad2_name", "ad2_surname", Role.ADMIN, "", "");

describe("User DAO unit tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    })

    describe("getIsUserAuthenticated", () => {
        test("It should resolve true", async () => {
            const userDAO = new UserDAO()
            const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {
                    username: "username",
                    password: "password",
                    salt: "salt"
                })
                return {} as Database
            });
            const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((size) => {
                return true
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            const result = await userDAO.getIsUserAuthenticated("username", "password")
            expect(result).toBe(true)
            mockTimingSafeEqual.mockRestore()
            mockDBRun.mockRestore()
            mockScrypt.mockRestore()
        })

        test("It should resolve false", async () => {
            const userDAO = new UserDAO()
            const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {
                    username: "username",
                    password: "password",
                    salt: "salt"
                })
                return {} as Database
            });
            const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((size) => {
                return false
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            const result = await userDAO.getIsUserAuthenticated("username", "password")
            expect(result).toBe(false)
            mockTimingSafeEqual.mockRestore()
            mockDBRun.mockRestore()
            mockScrypt.mockRestore()
        })

        test("It should return an error", async () => {
            const userDAO = new UserDAO()
            const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"), null)
                return {} as Database
            });
            const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((size) => {
                return true
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            await expect(userDAO.getIsUserAuthenticated("username", "password")).rejects.toThrow(Error);
            mockTimingSafeEqual.mockRestore()
            mockDBRun.mockRestore()
            mockScrypt.mockRestore()
        })
    })

    describe("createUser", () => {
        test("It should resolve true", async () => {
            const userDAO = new UserDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            const result = await userDAO.createUser("username", "name", "surname", "password", "role")
            expect(result).toBe(true)
            mockRandomBytes.mockRestore()
            mockDBRun.mockRestore()
            mockScrypt.mockRestore()
        })

        test("It should reject UserAlreadyExistsError", async () => {
            const userDAO = new UserDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("UNIQUE constraint failed: users.username"), null)
                return {} as Database
            });
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow(UserAlreadyExistsError);
            mockRandomBytes.mockRestore()
            mockDBRun.mockRestore()
            mockScrypt.mockRestore()
        })
    })

    describe("getUserByUsername", () => {
        test("Should return the user with a specific username", async () => {
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {
                    username: testCustom.username,
                    name: testCustom.name,
                    surname: testCustom.surname,
                    role: testCustom.role,
                    password: "test_pass",
                    salt: "test_salt",
                    address: testCustom.address,
                    birthdate: testCustom.birthdate
                })
                return {} as Database
            });
            const result = await userDAO.getUserByUsername(testCustom.username);
            expect(result).toEqual(testCustom);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })

        test("Should reject with an error", async () => {
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"), null)
                return {} as Database
            });
            await expect(userDAO.getUserByUsername(testCustom.username)).rejects.toThrow(Error);
            expect(mockDBGet).toHaveBeenCalledTimes(1); 
        })

        test("Should reject UserNotFoundError", async () => {
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, undefined)
                return {} as Database
            });
            await expect(userDAO.getUserByUsername(testCustom.username)).rejects.toThrow(UserNotFoundError);
            expect(mockDBGet).toHaveBeenCalledTimes(1); 
        })
    })

    describe("getUsers", () => {
        test("Should return all users", async () => {
            const userDAO = new UserDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [
                {
                    username: testCustom.username,
                    name: testCustom.name,
                    surname: testCustom.surname,
                    role: testCustom.role,
                    password: "test_pass",
                    salt: "test_salt",
                    address: testCustom.address,
                    birthdate: testCustom.birthdate
                },
                {
                    username: testCustom2.username,
                    name: testCustom2.name,
                    surname: testCustom2.surname,
                    role: testCustom2.role,
                    password: "test_pass",
                    salt: "test_salt",
                    address: testCustom2.address,
                    birthdate: testCustom2.birthdate
                },
                {
                    username: testMan.username,
                    name: testMan.name,
                    surname: testMan.surname,
                    role: testMan.role,
                    password: "test_pass",
                    salt: "test_salt",
                    address: testMan.address,
                    birthdate: testMan.birthdate
                },
                {
                    username: testAdmin.username,
                    name: testAdmin.name,
                    surname: testAdmin.surname,
                    role: testAdmin.role,
                    password: "test_pass",
                    salt: "test_salt",
                    address: testAdmin.address,
                    birthdate: testAdmin.birthdate
                },
                {
                    username: testAdmin2.username,
                    name: testAdmin2.name,
                    surname: testAdmin2.surname,
                    role: testAdmin2.role,
                    password: "test_pass",
                    salt: "test_salt",
                    address: testAdmin2.address,
                    birthdate: testAdmin2.birthdate
                } ])
                return {} as Database
            });
            const result = await userDAO.getUsers();
            expect(result).toEqual([testCustom, testCustom2, testMan, testAdmin, testAdmin2]);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        })

        test("Should reject with an error", async () => {
            const userDAO = new UserDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"), null)
                return {} as Database
            });
            await expect(userDAO.getUsers()).rejects.toThrow(Error);
            expect(mockDBAll).toHaveBeenCalledTimes(1); 
        })
    })

    describe("getUsersByRole", () => {
        test("Should return all users with a specific role", async () => {
            const userDAO = new UserDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [
                {
                    username: testCustom.username,
                    name: testCustom.name,
                    surname: testCustom.surname,
                    role: testCustom.role,
                    password: "test_pass",
                    salt: "test_salt",
                    address: testCustom.address,
                    birthdate: testCustom.birthdate
                },
                {
                    username: testCustom2.username,
                    name: testCustom2.name,
                    surname: testCustom2.surname,
                    role: testCustom2.role,
                    password: "test_pass",
                    salt: "test_salt",
                    address: testCustom2.address,
                    birthdate: testCustom2.birthdate
                } ])
                return {} as Database
            });
            const result = await userDAO.getUsersByRole(testCustom.role);
            expect(result).toEqual([testCustom, testCustom2]);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        })

        test("Should reject with an error", async () => {
            const userDAO = new UserDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"), null)
                return {} as Database
            });
            await expect(userDAO.getUsersByRole(testCustom.role)).rejects.toThrow(Error);
            expect(mockDBAll).toHaveBeenCalledTimes(1); 
        })
    })

    describe("deleteUser", () => {
        test("Should delete the user", async () => {
            const userDAO = new UserDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await expect(userDAO.deleteUser(testCustom.username));
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })

        test("Should reject with an error", async () => {
            const userDAO = new UserDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"))
                return {} as Database
            });
            await expect(userDAO.deleteUser(testCustom.username)).rejects.toThrow(Error);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
    })
    
    describe("deleteAll", () => {
        test("Should delete all users", async () => {
            const userDAO = new UserDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await expect(userDAO.deleteAll());
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })

        test("Should reject with an error", async () => {
            const userDAO = new UserDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"))
                return {} as Database
            });
            await expect(userDAO.deleteAll()).rejects.toThrow(Error);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
    })

    describe("userExist", () => {
        test("Should return true", async () => {
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {
                    username: testCustom.username,
                    name: testCustom.name,
                    surname: testCustom.surname,
                    role: testCustom.role,
                    password: "test_pass",
                    salt: "test_salt",
                    address: testCustom.address,
                    birthdate: testCustom.birthdate
                })
                return {} as Database
            });
            const result = await userDAO.userExist(testCustom.username);
            expect(result).toEqual(true);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })

        test("Should reject with an error", async () => {
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"), null)
                return {} as Database
            });
            await expect(userDAO.userExist(testCustom.username)).rejects.toThrow(Error);
            expect(mockDBGet).toHaveBeenCalledTimes(1); 
        })
    })

    describe("updateUserInfo", () => {
        test("Should update user info", async () => {
            const userDAO = new UserDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await userDAO.updateUserInfo("new_name", "new_surname", "new_address", "new_birthdate", testCustom.username);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })

        test("Should reject with an error", async () => {
            const userDAO = new UserDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"))
                return {} as Database
            });
            await expect(userDAO.updateUserInfo("new_name", "new_surname", "new_address", "new_birthdate", testCustom.username)).rejects.toThrow(Error);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
    })
})



