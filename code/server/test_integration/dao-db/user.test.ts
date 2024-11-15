import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import UserDAO from "../../src/dao/userDAO"

import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Role, User } from "../../src/components/user"
import { cleanup } from "../../src/db/cleanup"
import { UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError"

beforeAll(async() => {
    await cleanup();
    db.run(`INSERT INTO users (username, password, salt, role, name, surname, address, birthdate) VALUES
            ('frossi', '', '', 'Customer', 'Francesca', 'Rossi', NULL, NULL),
            ('mverdi', '', '', 'Customer', 'Mario', 'Verdi',  NULL, NULL),   
            ('gconti', '', '', 'Customer', 'Giulia', 'Conti', NULL, NULL),
            ('lbianchi', '', '', 'Manager', 'Luca', 'Bianchi', NULL, '1999-10-8'),
            ('mrossi', '', '', 'Manager', 'Maria', 'Rossi', NULL, NULL),
            ('sferrari', '', '', 'Customer', 'Sara', 'Ferrari', 'Via Roma, 123', NULL),
            ('vrossi', '', '', 'Admin', 'Valeria', 'Rossi', NULL, NULL);`
    );  
})

afterAll(async() => {
    await cleanup();
})

describe("User DAO-db integration tests", () => {

    describe("createUser", () => {
        test("It should return true", async () => {
            const userDAO = new UserDAO();
            const result = await userDAO.createUser("mbianchi", "Maria", "Bianchi", "m_password", "Customer");
            expect(result).toBe(true);
        })

        test("It should return UserAlreadyExistsError", async () => {
            const userDAO = new UserDAO();
            await expect(userDAO.createUser("frossi", "Francesca", "Rossi", "m_password", "Manager")).rejects.toThrowError(UserAlreadyExistsError);
        })
    })

    describe("getUserByUsername", () => {
        test("It should return the user with a specific username", async () => {
            const userDAO = new UserDAO();
            const result = await userDAO.getUserByUsername("frossi");
            expect(result).toEqual(new User("frossi", "Francesca", "Rossi", Role.CUSTOMER, null as unknown as string, null as unknown as string));
        })

        test("It should return UserNotFoundError", async () => {
            const userDAO = new UserDAO();
            await expect(userDAO.getUserByUsername("wrong")).rejects.toThrowError(UserNotFoundError);
        })
    })

    describe("getUsers", () => {
        test("It should return all users", async () => {
            const userDAO = new UserDAO();
            const result = await userDAO.getUsers();
            expect(result).toHaveLength(8);
            expect(result).toEqual(expect.arrayContaining([
                new User("frossi", "Francesca", "Rossi", Role.CUSTOMER, null as unknown as string, null as unknown as string),
                new User("mverdi", "Mario", "Verdi", Role.CUSTOMER, null as unknown as string, null as unknown as string),
                new User("gconti", "Giulia", "Conti", Role.CUSTOMER, null as unknown as string, null as unknown as string),
                new User("lbianchi", "Luca", "Bianchi", Role.MANAGER, null as unknown as string, "1999-10-8"),
                new User("mrossi", "Maria", "Rossi", Role.MANAGER, null as unknown as string, null as unknown as string),
                new User("sferrari", "Sara", "Ferrari", Role.CUSTOMER, "Via Roma, 123", null as unknown as string),
                new User("vrossi", "Valeria", "Rossi", Role.ADMIN, null as unknown as string, null as unknown as string),
                new User("mbianchi", "Maria", "Bianchi", Role.CUSTOMER, null as unknown as string, null as unknown as string)
            ]));
        })
    })

    describe("getUsersByRole", () => {
        test("It should return all users of a specific role", async () => {
            const userDAO = new UserDAO();
            const result = await userDAO.getUsersByRole("Manager");
            expect(result).toHaveLength(2);
            expect(result).toEqual(expect.arrayContaining([
                new User("lbianchi", "Luca", "Bianchi", Role.MANAGER, null as unknown as string, "1999-10-8"),
                new User("mrossi", "Maria", "Rossi", Role.MANAGER, null as unknown as string, null as unknown as string)
            ]));
        })
    })

    describe("deleteUser", () => {
        test("It should return true", async () => {
            const userDAO = new UserDAO();
            const result = await userDAO.deleteUser("frossi");
            expect(result).toBe(true);
        })
    })

    describe("userExist", () => {
        test("It should return true", async () => {
            const userDAO = new UserDAO();
            const result = await userDAO.userExist("sferrari");
            expect(result).toBe(true);
        })

        test("It should return false", async () => {
            const userDAO = new UserDAO();
            const result = await userDAO.userExist("wrong");
            expect(result).toBe(false);
        })
    })

    describe("updateUserInfo", () => {
        test("It should update a specific user info", async () => {
            const userDAO = new UserDAO();
            await userDAO.updateUserInfo("Mario", "Verdi", null as unknown as string, "1995-08-14", "mverdi");
            const result = await userDAO.getUserByUsername("mverdi");
            expect(result).toEqual(new User("mverdi", "Mario", "Verdi", Role.CUSTOMER, null as unknown as string, "1995-08-14"))
        })
    })

    describe("deleteAll", () => {
        test("It should return true", async () => {
            const userDAO = new UserDAO();
            const result = await userDAO.deleteAll();
            expect(result).toBe(true);
        })
    })
})