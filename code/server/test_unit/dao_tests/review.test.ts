import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import ReviewDAO from "../../src/dao/reviewDAO"

import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Role, User } from "../../src/components/user"
import { Category, Product } from "../../src/components/product"
import {ProductReview} from "../../src/components/review"
import exp from "constants"
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"

let testUserCustomer1 = new User("customerUser1","Customer1","User",Role.CUSTOMER,"","");
let testUserCustomer2 = new User("customerUser1","Customer2","User",Role.CUSTOMER,"","");

let testUserManager = new User("managerUser","Manager","User",Role.MANAGER,"","");
let testUserAdmin = new User("adminUser","Admin","User",Role.ADMIN,"","");

let testProduct1 = new Product(449.99,"Pixel 7a",Category.SMARTPHONE,"2024-06-01","...",1);
let testProduct2 = new Product(899.99,"MacBook Air",Category.LAPTOP,"2024-05-25","...",0);
let testProduct3 = new Product(499.99,"whirlpoolFridge",Category.APPLIANCE,"2024-05-20","...",5);

let testReview1 = new ProductReview(testProduct1.model,testUserCustomer1.username,4,"2024-05-30","Non male");
let testReview2 = new ProductReview(testProduct1.model,testUserCustomer2.username,5,"2024-06-03","Fantastico!");


describe("Review DAO unit tests", () => {
    afterEach(()=> {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    })

    describe("getProductReviews",()=> {
        test("Should return a list of reviews by model", async ()=> {
            const reviewDAO = new ReviewDAO();
            const mockDBAll = jest.spyOn(db,"all").mockImplementation((sql,params,callback) => {
                callback(null,[
                    {
                        model:testProduct1.model,
                        username: testUserCustomer1.username,
                        score:testReview1.score,
                        date:testReview1.date,
                        comment:testReview1.comment
                    },
                    {
                        model:testProduct1.model,
                        username:testUserCustomer2.username,
                        score:testReview2.score,
                        date:testReview2.date,
                        comment:testReview2.comment
                    }
                ])
                return {} as Database
            });
            const result = await reviewDAO.getProductReviews(testProduct1.model);
            expect(result).toEqual([testReview1,testReview2]);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        })

        test("Should reject with an error", async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBAll = jest.spyOn(db,"all").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"),[])
                return {} as Database
            });
            await expect(reviewDAO.getProductReviews(testProduct1.model)).rejects.toThrow(Error);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        })

    })

    describe("deleteAllReviews",() => {
        test("Should delete all reviews of all products", async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
             });
        await reviewDAO.deleteAllReviews();
        expect(mockDBRun).toHaveBeenCalledTimes(1);
        })

        test("Should reject with an error",async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBRun = jest.spyOn(db,"run").mockImplementation((sql,params,callback) => {
                callback(new Error("Error"))
                return {} as Database
            });
            await expect(reviewDAO.deleteAllReviews()).rejects.toThrowError(Error);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })

    })

    describe("deleteReviewsOfProduct", () => {
        test("Should delete all reviews for a specific model", async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBRun = jest.spyOn(db,"run").mockImplementation((sql,params,callback) => {
                callback(null)
                return {} as Database
            });
            await reviewDAO.deleteReviewsOfProduct(testProduct1.model);
            expect(mockDBRun).toHaveBeenCalledTimes(1)
        })

        test("Should reject with an error", async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBRun = jest.spyOn(db,"run").mockImplementation((sql,params,callback) => {
                callback(new Error("Error"))
                return {} as Database
            })
            await expect(reviewDAO.deleteReviewsOfProduct(testProduct1.model)).rejects.toThrow(Error);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
    })

    describe("deleteReview", () => {
        test("Should delete review for a product made by a specific user", async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBRun = jest.spyOn(db,"run").mockImplementation((sql,param,callback) => {
                callback(null)
                return {} as Database
            });
            await reviewDAO.deleteReview(testProduct1.model,testUserCustomer1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })

        test("Should reject with an error", async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBRun = jest.spyOn(db,"run").mockImplementation((sql,param,callback)=> {
                callback(new Error("Error"))
                return {} as Database
            });
            await expect(reviewDAO.deleteReview(testProduct1.model,testUserCustomer1)).rejects.toThrow(Error);
            expect(mockDBRun).toBeCalledTimes(1);

        })

    })

    describe("addReview", () => {
        test("Should add a new review", async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBRun = jest.spyOn(db,"run").mockImplementation((sql,params,callback) => {
                callback(null)
                return {} as Database
            });
            await reviewDAO.addReview(testProduct1.model,testUserCustomer1,testReview1.score,testReview1.comment);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })

        test("Should reject ExistingReviewError", async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBRun = jest.spyOn(db,"run").mockImplementation((sql,param,callback) => {
                callback(new Error("UNIQUE constraint failed: reviews.model, reviews.username"))
                return {} as Database
            });

            await expect(reviewDAO.addReview(testProduct1.model,testUserCustomer1,testReview1.score,testReview1.comment)).rejects.toThrow(ExistingReviewError)
            expect(mockDBRun).toHaveBeenCalledTimes(1);
            mockDBRun.mockRestore()
        })

        test("Should reject with an error", async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBRun = jest.spyOn(db,"run").mockImplementation((sql,param,callback)=> {
                callback(new Error("Error"))
                return {} as Database
            });
        await expect(reviewDAO.addReview(testProduct1.model,testUserCustomer1,testReview1.score,testReview1.comment)).rejects.toThrow(Error);
        expect(mockDBRun).toHaveBeenCalledTimes(1);
        })
    })

    describe("existReview",() => {
        test("Should check if a review exists", async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBGet = jest.spyOn(db,"get").mockImplementation((sql, params, callback) => {
                callback(null, {
                    model:testProduct1.model,
                    username:testUserCustomer1.username
                })
                return {} as Database
            });
            const result = await reviewDAO.existReview(testProduct1.model,testUserCustomer1);
            expect(result)
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })

        test("Should reject a NoReviewProductError", async() => {
            const reviewDAO = new ReviewDAO();
            const mockDBGet = jest.spyOn(db,"get").mockImplementation((sql, params, callback) => {
                callback(null, undefined)
                return {} as Database
            });
            await expect(reviewDAO.existReview(testProduct1.model,testUserCustomer1)).rejects.toThrow(NoReviewProductError);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })

        test("Should reject with an error", async() => {
            const reviewDAO = new ReviewDAO();
            const mockDBGet = jest.spyOn(db,"get").mockImplementation((sql, params, callback) => {
                callback(new Error("Error"))
                return {} as Database
            });
            await expect(reviewDAO.existReview(testProduct1.model,testUserCustomer1)).rejects.toThrow(Error);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        })
    })
})