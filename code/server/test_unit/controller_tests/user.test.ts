import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { Role, User } from "../../src/components/user";
import { UnauthorizedUserError, UserIsAdminError, UserNotFoundError } from "../../src/errors/userError";
import dayjs from "dayjs";
import { DateError } from "../../src/utilities";

jest.mock("../../src/dao/userDAO")

const testCustom = new User("customer", "cust_name", "cust_surname", Role.CUSTOMER, "", "");
const testCustom2 = new User("customer2", "cust2_name", "cust2_surname", Role.CUSTOMER, "", "");
const testMan = new User("manager", "man_name", "man_surname", Role.MANAGER, "", "");
const testAdmin = new User("admin", "ad_name", "ad_surname", Role.ADMIN, "", "");
const testAdmin2 = new User("admin2", "ad2_name", "ad2_surname", Role.ADMIN, "", "");

describe("User controller unit tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks(); 
    });

    describe("createUser", () => {
        //Example of a unit test for the createUser method of the UserController
        //The test checks if the method returns true when the DAO method returns true
        //The test also expects the DAO method to be called once with the correct parameters

        test("It should return true", async () => {
            const testUser = { //Define a test user object
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }
            jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
            const controller = new UserController(); //Create a new instance of the controller
            //Call the createUser method of the controller with the test user object
            const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

            //Check if the createUser method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role);
            expect(response).toBe(true); //Check if the response is true
        });
    })

    describe("getUsers", () => {
        test("It should return all users", async () => {
            const userList = [testCustom, testMan, testAdmin];

            jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(userList);
            const controller = new UserController();
            const response = await controller.getUsers();

            expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
            expect(response).toBe(userList);
        });

        test("It should return an error", async () => {
            const userList = [testCustom, testMan, testAdmin];

            jest.spyOn(UserDAO.prototype, "getUsers").mockRejectedValueOnce(new Error("Error"));
            const controller = new UserController();
            await expect(controller.getUsers()).rejects.toThrow(Error);

            expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
        });
    })

    describe("getUsersByRole", () => {
        test("It should return all users with a specific role", async () => {
            const userList = [testCustom, testCustom2];
            const role = "Customer";

            jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce(userList);
            const controller = new UserController();
            const response = await controller.getUsersByRole(role);

            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
            expect(response).toBe(userList);
        });

        test("It should return an error", async () => {
            const userList = [testCustom, testCustom2];
            const role = "Customer";

            jest.spyOn(UserDAO.prototype, "getUsersByRole").mockRejectedValue(new Error("Error"));
            const controller = new UserController();
            await expect(controller.getUsersByRole(role)).rejects.toThrow(Error);

            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
        });
    })

    describe("getUserByUsername", () => {
        test("It should return the user with a specific username", async () => {

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testCustom);
            const controller = new UserController();
            const response = await controller.getUserByUsername(testAdmin, testCustom.username);
    
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(response).toBe(testCustom);
        });

        test("It should return the user with a specific username", async () => {

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(testCustom);
            const controller = new UserController();
            const response = await controller.getUserByUsername(testCustom, testCustom.username);
    
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(response).toBe(testCustom);
        });

        test("It should return UserNotFoundError", async () => {

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError);
            const controller = new UserController();
            await expect(controller.getUserByUsername(testAdmin, "wrong_username")).rejects.toThrow(UserNotFoundError);
    
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
        });

        test("It should return UnauthorizedUserError", async () => {

            const controller = new UserController();
            await expect(controller.getUserByUsername(testMan, testCustom.username)).rejects.toThrow(UnauthorizedUserError);
    
            expect(UserDAO.prototype.getUserByUsername).not.toHaveBeenCalled();
        });

        test("It should return UnauthorizedUserError", async () => {

            const controller = new UserController();
            await expect(controller.getUserByUsername(testCustom2, testCustom.username)).rejects.toThrow(UnauthorizedUserError);
    
            expect(UserDAO.prototype.getUserByUsername).not.toHaveBeenCalled();
        });
    })
    
    describe("deleteUser", () => {
        test("It should return true", async () => {

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(testCustom);
            jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
            const controller = new UserController();
            const response = await controller.deleteUser(testAdmin, testCustom.username);
    
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(response).toBe(true);
        });

        test("It should return true", async () => {

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(testCustom);
            jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
            const controller = new UserController();
            const response = await controller.deleteUser(testCustom, testCustom.username);
    
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(response).toBe(true);
        });

        test("It should return UserNotFoundError", async () => {

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValue(new UserNotFoundError);
            const controller = new UserController();
            await expect(controller.deleteUser(testAdmin, "wrong_username")).rejects.toThrow(UserNotFoundError);
    
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
            expect(UserDAO.prototype.deleteUser).not.toHaveBeenCalled();
        });

        test("It should return UnauthorizedUserError", async () => {

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(testCustom);
            const controller = new UserController();
            await expect(controller.deleteUser(testMan, testCustom.username)).rejects.toThrow(UnauthorizedUserError);
    
            expect(UserDAO.prototype.deleteUser).not.toHaveBeenCalled();
        });

        test("It should return UnauthorizedUserError", async () => {

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(testCustom);
            const controller = new UserController();
            await expect(controller.deleteUser(testCustom2, testCustom.username)).rejects.toThrow(UnauthorizedUserError);
    
            expect(UserDAO.prototype.deleteUser).not.toHaveBeenCalled();
        });

        test("It should return UserIsAdminError", async () => {

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(testAdmin2);
            const controller = new UserController();
            await expect(controller.deleteUser(testAdmin, testAdmin2.username)).rejects.toThrow(UserIsAdminError);
    
            expect(UserDAO.prototype.deleteUser).not.toHaveBeenCalled();
        });
    })

    describe("deleteAll", () => {
        test("It should return true", async () => {

            jest.spyOn(UserDAO.prototype, "deleteAll").mockResolvedValueOnce(true);
            const controller = new UserController();
            const response = await controller.deleteAll();
    
            expect(UserDAO.prototype.deleteAll).toHaveBeenCalledTimes(1);
            expect(response).toBe(true);
        });
    })

    describe("updateUserInfo", () => {
        test("It should return the updated user", async () => {
            const updateCustom = new User(testCustom.username, "new_name", "new_surname", Role.CUSTOMER, "new_address", "new_birthdate");

            jest.spyOn(UserDAO.prototype, "userExist").mockResolvedValue(true);
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(updateCustom);
            const controller = new UserController();
            const response = await controller.updateUserInfo(testCustom, "new_name", "new_surname", "new_address", "new_birthdate", testCustom.username);

            expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(2);
            expect(response).toBe(updateCustom);
        })

        test("It should return the updated user", async () => {
            const updateCustom = new User(testCustom.username, "new_name", "new_surname", Role.CUSTOMER, "new_address", "new_birthdate");

            jest.spyOn(UserDAO.prototype, "userExist").mockResolvedValue(true);
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(updateCustom);
            const controller = new UserController();
            const response = await controller.updateUserInfo(testAdmin, "new_name", "new_surname", "new_address", "new_birthdate", testCustom.username);

            expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(2);
            expect(response).toBe(updateCustom);
        })

        test("It should return UserNotFoundError", async () => {

            jest.spyOn(UserDAO.prototype, "userExist").mockResolvedValue(false);
            const controller = new UserController();
            await expect(controller.updateUserInfo(testAdmin, "new_name", "new_surname", "new_address", "new_birthdate", "wrong_username")).rejects.toThrow(UserNotFoundError);
    
            expect(UserDAO.prototype.userExist).toHaveBeenCalled();
            expect(UserDAO.prototype.updateUserInfo).not.toHaveBeenCalled();
            expect(UserDAO.prototype.getUserByUsername).not.toHaveBeenCalled();
        });

        test("It should return UnauthorizedUserError", async () => {
            const updateCustom = new User(testCustom2.username, "new_name", "new_surname", Role.CUSTOMER, "new_address", "new_birthdate");

            jest.spyOn(UserDAO.prototype, "userExist").mockResolvedValue(true);
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(updateCustom);
            const controller = new UserController();
            await expect(controller.updateUserInfo(testCustom, "new_name", "new_surname", "new_address", "new_birthdate", testCustom2.username)).rejects.toThrow(UnauthorizedUserError);
            
            expect(UserDAO.prototype.userExist).toHaveBeenCalled();
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUserInfo).not.toHaveBeenCalled();
        });

        test("It should return DateError", async () => {

            jest.spyOn(UserDAO.prototype, "userExist").mockResolvedValue(true);
            jest.spyOn(dayjs.prototype, "isBefore").mockResolvedValue(true);
            const controller = new UserController();
            await expect(controller.updateUserInfo(testCustom, "new_name", "new_surname", "new_address", "new_birthdate", testCustom.username)).rejects.toThrow(DateError);
            
            expect(UserDAO.prototype.userExist).toHaveBeenCalled();
            expect(dayjs.prototype.isBefore).toHaveBeenCalled();
            expect(UserDAO.prototype.getUserByUsername).not.toHaveBeenCalled();
            expect(UserDAO.prototype.updateUserInfo).not.toHaveBeenCalled();
        });

        test("It should return UnauthorizedUserError", async () => {
            const updateCustom = new User(testCustom.username, "new_name", "new_surname", Role.CUSTOMER, "new_address", "new_birthdate");

            jest.spyOn(UserDAO.prototype, "userExist").mockResolvedValue(true);            
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(updateCustom);

            const controller = new UserController();
            await expect(controller.updateUserInfo(testMan, "new_name", "new_surname", "new_address", "new_birthdate", testCustom.username)).rejects.toThrow(UnauthorizedUserError);
            
            expect(UserDAO.prototype.userExist).toHaveBeenCalled();
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUserInfo).not.toHaveBeenCalled();
        });

        test("It should return UserIsAdminError", async () => {
            const updateCustom = new User(testAdmin2.username, "new_name", "new_surname", Role.ADMIN, "new_address", "new_birthdate");

            jest.spyOn(UserDAO.prototype, "userExist").mockResolvedValue(true);
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(updateCustom);
            const controller = new UserController();
            await expect(controller.updateUserInfo(testAdmin, "new_name", "new_surname", "new_address", "new_birthdate", testAdmin2.username)).rejects.toThrow(UserIsAdminError);
            
            expect(UserDAO.prototype.userExist).toHaveBeenCalled();
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUserInfo).not.toHaveBeenCalled();
        });
    })
})