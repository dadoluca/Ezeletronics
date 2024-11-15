import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"

import request from 'supertest'
import { cleanup } from "../../src/db/cleanup"
import { Role, User } from "../../src/components/user"
import UserController from "../../src/controllers/userController"
import db from "../../src/db/db"
import { UnauthorizedUserError, UserIsAdminError, UserNotFoundError } from "../../src/errors/userError"
import { DateError } from "../../src/utilities"

const routePath = "/ezelectronics"

const testAdmin = new User("vrossi", "Valeria", "Rossi", Role.ADMIN, null as unknown as string, null as unknown as string);
const testAdmin2 = new User("sferrari", "Sara", "Ferrari", Role.ADMIN, "Via Roma, 123", null as unknown as string);
const testMan = new User("lbianchi", "Luca", "Bianchi", Role.MANAGER, null as unknown as string, "1999-10-8");
const testCustom = new User("frossi", "Francesca", "Rossi", Role.CUSTOMER, null as unknown as string, null as unknown as string);
const testCustom2 = new User("mverdi", "Mario", "Verdi", Role.CUSTOMER, null as unknown as string, null as unknown as string);

beforeAll(async() => {
    await cleanup();
    db.run(`INSERT INTO users (username, password, salt, role, name, surname, address, birthdate) VALUES
            ('frossi', '', '', 'Customer', 'Francesca', 'Rossi', NULL, NULL),
            ('mverdi', '', '', 'Customer', 'Mario', 'Verdi',  NULL, NULL),   
            ('gconti', '', '', 'Customer', 'Giulia', 'Conti', NULL, NULL),
            ('lbianchi', '', '', 'Manager', 'Luca', 'Bianchi', NULL, '1999-10-8'),
            ('mrossi', '', '', 'Manager', 'Maria', 'Rossi', NULL, NULL),
            ('sferrari', '', '', 'Admin', 'Sara', 'Ferrari', 'Via Roma, 123', NULL),
            ('vrossi', '', '', 'Admin', 'Valeria', 'Rossi', NULL, NULL);`
    );
})

afterAll(() => {
    cleanup();
})

describe("User controller integration tests", () => {
    describe("createUser", () => {
        test("It should add a new user to the database", async () => {
            const controller = new UserController();
            const user = new User("mbianchi", "Maria", "Bianchi", Role.CUSTOMER, null as unknown as string, null as unknown as string);
            const result = await controller.createUser("mbianchi", "Maria", "Bianchi", "m_password", "Customer");
            expect(result).toBe(true);
            const check = await controller.getUserByUsername(testAdmin, user.username);
            expect(check).toEqual(user);
        })
    })
    
    describe("getUsers", () => {
        test("It should return all users", async () => {
            const controller = new UserController();
            const result = await controller.getUsers();
            expect(result).toEqual(expect.arrayContaining([
                testCustom,
                testCustom2,
                new User("gconti", "Giulia", "Conti", Role.CUSTOMER, null as unknown as string, null as unknown as string),
                testMan,
                new User("mrossi", "Maria", "Rossi", Role.MANAGER, null as unknown as string, null as unknown as string),
                testAdmin2,
                testAdmin,
                new User("mbianchi", "Maria", "Bianchi", Role.CUSTOMER, null as unknown as string, null as unknown as string)
            ]));
            expect(result).toHaveLength(8);
        })
    })
    
    describe("getUsersByRole", () => {
        test("It should return all users of a specific role", async () => {
            const controller = new UserController();
            const result = await controller.getUsersByRole("Manager");
            expect(result).toHaveLength(2);
            expect(result).toEqual(expect.arrayContaining([
                testMan,
                new User("mrossi", "Maria", "Rossi", Role.MANAGER, null as unknown as string, null as unknown as string)
            ]));
        })
    })

    describe("getUserByUsername", () => {
        test("It should return the user with a specific username", async () => {
            const controller = new UserController();
            const result = await controller.getUserByUsername(testAdmin, testCustom.username);
            expect(result).toEqual(testCustom);
        })

        test("It should return UserNotFoundError", async () => {
            const controller = new UserController();
            await expect(controller.getUserByUsername(testAdmin, "wrong_username")).rejects.toThrow(UserNotFoundError);
        });

        test("It should return UnauthorizedUserError", async () => {
            const controller = new UserController();
            await expect(controller.getUserByUsername(testMan, testCustom.username)).rejects.toThrow(UnauthorizedUserError);
        });

        test("It should return UnauthorizedUserError", async () => {
            const controller = new UserController();
            await expect(controller.getUserByUsername(testCustom2, testCustom.username)).rejects.toThrow(UnauthorizedUserError);
        });
    })

    describe("updateUserInfo", () => {
        test("It should return UserNotFoundError", async () => {
            const controller = new UserController();
            await expect(controller.updateUserInfo(testAdmin, "Francesca", "Rossi", "Corso Duca degli Abruzzi, 26", "2000-03-10", "wrong_username")).rejects.toThrow(UserNotFoundError);
        });

        test("It should return UnauthorizedUserError", async () => {
            const controller = new UserController();
            await expect(controller.updateUserInfo(testCustom, "Francesca", "Rossi", "Corso Duca degli Abruzzi, 26", "2000-03-10", testCustom2.username)).rejects.toThrow(UnauthorizedUserError);
            const check = await controller.getUserByUsername(testAdmin, testCustom2.username);
            expect(check).toEqual(testCustom2);
        });

        test("It should return DateError", async () => {
            const controller = new UserController();
            await expect(controller.updateUserInfo(testCustom, "Francesca", "Rossi", "Corso Duca degli Abruzzi, 26", "2100-03-10", testCustom.username)).rejects.toThrow(DateError);
            const check = await controller.getUserByUsername(testAdmin, testCustom.username);
            expect(check).toEqual(testCustom);
        });

        test("It should return UnauthorizedUserError", async () => {
            const controller = new UserController();
            await expect(controller.updateUserInfo(testMan, "Francesca", "Rossi", "Corso Duca degli Abruzzi, 26", "2000-03-10", testCustom.username)).rejects.toThrow(UnauthorizedUserError);
            const check = await controller.getUserByUsername(testAdmin, testCustom.username);
            expect(check).toEqual(testCustom);
        });

        test("It should update a specific user info in the database", async () => {
            const updateCustom = new User(testCustom.username, "Francesca", "Rossi", Role.CUSTOMER, "Corso Duca degli Abruzzi, 26", "2000-03-10");

            const controller = new UserController();
            const response = await controller.updateUserInfo(testCustom, "Francesca", "Rossi", "Corso Duca degli Abruzzi, 26", "2000-03-10", testCustom.username);
            expect(response).toEqual(updateCustom);
            const check = await controller.getUserByUsername(testAdmin, testCustom.username);
            expect(check).toEqual(updateCustom);
        })

        test("It should update a specific user info in the database", async () => {
            const updateCustom = new User(testCustom.username, "Francesca", "Rossi", Role.CUSTOMER, "Corso Duca degli Abruzzi, 26", "2000-04-15");

            const controller = new UserController();
            const response = await controller.updateUserInfo(testAdmin, "Francesca", "Rossi", "Corso Duca degli Abruzzi, 26", "2000-04-15", testCustom.username);
            expect(response).toEqual(updateCustom);
            const check = await controller.getUserByUsername(testAdmin, testCustom.username);
            expect(check).toEqual(updateCustom);
        })
    })

    describe("deleteUser", () => {
        test("It should return UnauthorizedUserError", async () => {
            const controller = new UserController();
            await expect(controller.deleteUser(testMan, testCustom2.username)).rejects.toThrow(UnauthorizedUserError);
            const check = await controller.getUserByUsername(testAdmin, testCustom2.username);
            expect(check).toEqual(testCustom2);
        })

        test("It should return UnauthorizedUserError", async () => {
            const controller = new UserController();
            await expect(controller.deleteUser(testCustom, testCustom2.username)).rejects.toThrow(UnauthorizedUserError);
            const check = await controller.getUserByUsername(testAdmin, testCustom2.username);
            expect(check).toEqual(testCustom2);
        })

        test("It should return UserIsAdminError", async () => {
            const controller = new UserController();
            await expect(controller.deleteUser(testAdmin, testAdmin2.username)).rejects.toThrow(UserIsAdminError);
            const check = await controller.getUserByUsername(testAdmin, testAdmin2.username);
            expect(check).toEqual(testAdmin2);
        })

        test("It should delete a specific user from the database", async () => {
            const controller = new UserController();
            const result = await controller.deleteUser(testCustom2, testCustom2.username);
            expect(result).toBe(true);
            await expect(controller.getUserByUsername(testAdmin, testCustom2.username)).rejects.toThrow(UserNotFoundError);
        })

        test("It should delete a specific user from the database", async () => {
            const controller = new UserController();
            const result = await controller.deleteUser(testAdmin, testCustom.username);
            expect(result).toBe(true);
            await expect(controller.getUserByUsername(testAdmin, testCustom.username)).rejects.toThrow(UserNotFoundError);
        })
    })

    describe("deleteAll", () => {
        test("It should delete all users from the database", async () => {
            const controller = new UserController();
            const response = await controller.deleteAll();
            expect(response).toBe(true);
            const check = await controller.getUsers();
            expect(check).toHaveLength(2);
            expect(check).toEqual(expect.arrayContaining([testAdmin2, testAdmin]));
        })
    })
})