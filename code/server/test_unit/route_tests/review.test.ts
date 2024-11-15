import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import { Role, User } from "../../src/components/user"
import { app } from "../../index"
import request from 'supertest'
import Authenticator from "../../src/routers/auth"
import { Product, Category } from "../../src/components/product"
import { ProductReview } from "../../src/components/review"
import ReviewController from "../../src/controllers/reviewController"
import exp from "constants"

const baseURL = "/ezelectronics"
jest.mock("../../src/controllers/cartController");
jest.mock("../../src/routers/auth");

let testUserCustomer1 = new User("customerUser1","Customer1","User",Role.CUSTOMER,"","");
let testUserCustomer2 = new User("customerUser1","Customer2","User",Role.CUSTOMER,"","");
let testUserManager = new User("managerUser","Manager","User",Role.MANAGER,"","");
let testUserAdmin = new User("adminUser","Admin","User",Role.ADMIN,"","");

let testProduct1 = new Product(449.99,"Pixel 7a",Category.SMARTPHONE,"2024-06-01","...",1);
let testProduct2 = new Product(899.99,"MacBook Air",Category.LAPTOP,"2024-05-25","...",0);
let testProduct3 = new Product(499.99,"whirlpoolFridge",Category.APPLIANCE,"2024-05-20","...",5);

let testReview1 = new ProductReview(testProduct1.model,testUserCustomer1.username,4,"2024-05-30","Non male");
let testReview2 = new ProductReview(testProduct1.model,testUserCustomer2.username,5,"2024-06-03","Fantastico!");

describe ("Reviews routes unit tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    })
        describe("POST /reviews/:model", () => {
            test("It should return a 200 status code", async () => {
                const addReview = jest.spyOn(ReviewController.prototype,"addReview").mockResolvedValueOnce();
                const logged = jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementation((req:any,res:any,next:any) => next());
                const customer = jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req: any, res: any, next: any) => next());

                const response = await request(app).post(baseURL + "/reviews/"+testProduct1.model).send({score: testReview1.score, comment: testReview1.comment});

                expect(response.status).toBe(200);
                expect(logged).toHaveBeenCalledTimes(1);
                expect(customer).toHaveBeenCalledTimes(1);
                expect(addReview).toHaveBeenCalledTimes(1);
            })

            test("It should return a 401 error code (user not logged in)", async () => {
                const addReview = jest.spyOn(ReviewController.prototype,"addReview").mockResolvedValueOnce();
                const logged = jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementation((req:any,res:any,next:any) => res.status(401).send());
                const customer = jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req: any, res: any, next: any) => next());

                const response = await request(app).post(baseURL + "/reviews/"+testProduct1.model).send({score: testReview1.score, comment: testReview1.comment});

                expect(response.status).toBe(401);
                expect(addReview).not.toHaveBeenCalled();
                expect(logged).toHaveBeenCalledTimes(1);
                expect(customer).not.toHaveBeenCalled();

            })

            test("It should return a 401 error code (user is not a customer)", async () => {
                const addReview = jest.spyOn(ReviewController.prototype,"addReview").mockResolvedValueOnce();
                const logged = jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementation((req:any,res:any,next:any) => next() );
                const customer = jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req: any, res: any, next: any) => res.status(401).send());

                const response = await request(app).post(baseURL + "/reviews/"+testProduct1.model).send({score:testReview1.score, comment: testReview1.comment});

                expect(response.status).toBe(401);
                expect(addReview).not.toHaveBeenCalled();
                expect(logged).toHaveBeenCalledTimes(1);
                expect(customer).toHaveBeenCalledTimes(1);

            })

            test("It should return an error", async () => {
                const addReview = jest.spyOn(ReviewController.prototype,"addReview").mockRejectedValueOnce(new Error("Error"));
                const logged = jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementation((req:any,res:any,next:any) => next() );
                const customer = jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req: any, res: any, next: any) => next());

                const response = await request(app).post(baseURL + "/reviews/"+testProduct1.model).send({score:testReview1.score, comment: testReview1.comment});

                expect(response.status).not.toBe(200);
                expect(addReview).toHaveBeenCalledTimes(1);
                expect(logged).toHaveBeenCalledTimes(1);
                expect(customer).toHaveBeenCalledTimes(1);

            })
        })

        describe("GET /reviews/:model", () => {
            test("It should return an array of reviews", async () => {
                const reviewList: ProductReview[] = [testReview1,testReview2]
                const getReviews = jest.spyOn(ReviewController.prototype,"getProductReviews").mockResolvedValueOnce(reviewList);
                const logged = jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());

                const response = await request(app).get(baseURL + "/reviews/" + testProduct1.model);

                expect(response.status).toBe(200);
                expect(response.body).toEqual(reviewList);

                expect(getReviews).toHaveBeenCalledTimes(1);
                expect(logged).toHaveBeenCalledTimes(1);

            })

            test ("It should return a 401 error code (user not logged in)", async () => {
                const reviewList: ProductReview[] = [testReview1,testReview2]
                const getReviews = jest.spyOn(ReviewController.prototype,"getProductReviews").mockResolvedValueOnce(reviewList);
                const logged = jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());

                const response = await request(app).get(baseURL + "/reviews/" + testProduct1.model);

                expect(response.status).toBe(401);
                expect(getReviews).not.toHaveBeenCalled();
                expect(logged).toHaveBeenCalledTimes(1);
            })

            test("It should return an error", async () => {
                const getReviews = jest.spyOn(ReviewController.prototype,"getProductReviews").mockRejectedValueOnce(new Error("Error"));
                const logged = jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());

                const response = await request(app).get(baseURL + "/reviews/" + testProduct1.model);

                expect(response.status).not.toBe(200);
                expect(getReviews).toHaveBeenCalledTimes(1);
                expect(logged).toHaveBeenCalledTimes(1);

            })

        })

        describe("DELETE /reviews/:model", () => {
            test("It should return a 200 success code", async () => {
                const deleteReview = jest.spyOn(ReviewController.prototype,"deleteReview").mockResolvedValueOnce();
                const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
                const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());

                const response = await request(app).delete(baseURL + "/reviews/" + testProduct1.model);

                expect(response.status).toBe(200);
                expect(logged).toHaveBeenCalledTimes(1);
                expect(customer).toHaveBeenCalledTimes(1);
                expect(deleteReview).toHaveBeenCalledTimes(1);
            })

            test("It should return a 401 error code (user not logged in)", async () => {
                const deleteReview = jest.spyOn(ReviewController.prototype,"deleteReview").mockResolvedValueOnce();
                const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
                const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());

                const response = await request(app).delete(baseURL + "/reviews/" + testProduct1.model);

                expect(response.status).toBe(401);
                expect(logged).toHaveBeenCalledTimes(1);
                expect(customer).not.toHaveBeenCalled();
                expect(deleteReview).not.toHaveBeenCalled();

            })

            test("It should return a 401 error code (user is not a customer)", async () => {
                const deleteReview = jest.spyOn(ReviewController.prototype,"deleteReview").mockResolvedValueOnce();
                const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next() );
                const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => res.status(401).send() );

                const response = await request(app).delete(baseURL + "/reviews/" + testProduct1.model);


                expect(response.status).toBe(401);
                expect(logged).toHaveBeenCalledTimes(1);
                expect(customer).toHaveBeenCalledTimes(1);
                expect(deleteReview).not.toHaveBeenCalled();

            })

            test("It should return an error", async () => {
                const deleteReview = jest.spyOn(ReviewController.prototype,"deleteReview").mockRejectedValueOnce(new Error("Error"));
                const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
                const customer= jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => next());

                const response = await request(app).delete(baseURL + "/reviews/" + testProduct1.model);

                expect(response.status).not.toBe(200);
                expect(logged).toHaveBeenCalledTimes(1);
                expect(customer).toHaveBeenCalledTimes(1);
                expect(deleteReview).toHaveBeenCalledTimes(1);
            })
        })

        describe("DELETE /reviews/:model/all" ,() => {
            test("It should return a 200 success code", async() => {
                const deleteReviewsOfProduct = jest.spyOn(ReviewController.prototype,"deleteReviewsOfProduct").mockResolvedValueOnce();
                const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
                const isAdminOrManager = jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req: any, res: any, next: any) => next())

                const response = await request(app).delete(baseURL + "/reviews/" + testProduct1.model + "/all");

                expect(response.status).toBe(200);
                expect(logged).toHaveBeenCalledTimes(1);
                expect(isAdminOrManager).toHaveBeenCalledTimes(1);
                expect(deleteReviewsOfProduct).toHaveBeenCalledTimes(1);

            })

            test("It should return a 401 error code (user not logged in)", async () => {
                const deleteReviewsOfProduct = jest.spyOn(ReviewController.prototype,"deleteReviewsOfProduct").mockResolvedValueOnce();
                const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
                const isAdminOrManager = jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req: any, res: any, next: any) => next());

                const response = await request(app).delete(baseURL + "/reviews/" + testProduct1.model + "/all");

                expect(response.status).toBe(401);
                expect(logged).toHaveBeenCalledTimes(1);
                expect(isAdminOrManager).not.toHaveBeenCalled();
                expect(deleteReviewsOfProduct).not.toHaveBeenCalled();

            })

            test("It should return a 401 error code (user is not a manager or admin)", async () => {
                const deleteReviewsOfProduct = jest.spyOn(ReviewController.prototype,"deleteReviewsOfProduct").mockResolvedValueOnce();
                const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
                const isAdminOrManager = jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req: any, res: any, next: any) => res.status(401).send());

                const response = await request(app).delete(baseURL + "/reviews/" + testProduct1.model + "/all");

                expect(response.status).toBe(401);
                expect(logged).toHaveBeenCalledTimes(1);
                expect(isAdminOrManager).toHaveBeenCalledTimes(1);
                expect(deleteReviewsOfProduct).not.toHaveBeenCalled();

            })

            test("It should return an error", async() => {
                const deleteReviewsOfProduct = jest.spyOn(ReviewController.prototype,"deleteReviewsOfProduct").mockRejectedValueOnce(new Error("Error"));
                const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
                const isAdminOrManager = jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req: any, res: any, next: any) => next())

                const response = await request(app).delete(baseURL + "/reviews/" + testProduct1.model + "/all");

                expect(response.status).not.toBe(200);
                expect(logged).toHaveBeenCalledTimes(1);
                expect(isAdminOrManager).toHaveBeenCalledTimes(1);
                expect(deleteReviewsOfProduct).toHaveBeenCalledTimes(1);

            })

        })

        describe("DELETE /reviews", () => {
            test("It should return a 200 success code", async () => {
                const deleteAllReviews =jest.spyOn(ReviewController.prototype,"deleteAllReviews").mockResolvedValueOnce();
                const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
                const isAdminOrManager = jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req: any, res: any, next: any) => next());

                const response = await request(app).delete(baseURL + "/reviews");

                expect(response.status).toBe(200);
                expect(logged).toHaveBeenCalledTimes(1);
                expect(isAdminOrManager).toHaveBeenCalledTimes(1);
                expect(deleteAllReviews).toHaveBeenCalledTimes(1);
            })

            test("It should return a 401 error code (user not logged in)", async () => {
                const deleteAllReviews =jest.spyOn(ReviewController.prototype,"deleteAllReviews").mockResolvedValueOnce();
                const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => res.status(401).send());
                const isAdminOrManager = jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req: any, res: any, next: any) => next());

                const response = await request(app).delete(baseURL + "/reviews");

                expect(response.status).toBe(401);
                expect(logged).toHaveBeenCalledTimes(1);
                expect(isAdminOrManager).not.toHaveBeenCalled();
                expect(deleteAllReviews).not.toHaveBeenCalled();
            })

            test("It should return a 401 error code (user is not a manager or admin)", async () => {
                const deleteAllReviews =jest.spyOn(ReviewController.prototype,"deleteAllReviews").mockResolvedValueOnce();
                const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
                const isAdminOrManager = jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req: any, res: any, next: any) => res.status(401).send());

                const response = await request(app).delete(baseURL + "/reviews");

                expect(response.status).toBe(401);
                expect(logged).toHaveBeenCalledTimes(1);
                expect(isAdminOrManager).toHaveBeenCalledTimes(1);
                expect(deleteAllReviews).not.toHaveBeenCalled();
            })

            test("It should return an error", async () => {
                const deleteAllReviews =jest.spyOn(ReviewController.prototype,"deleteAllReviews").mockRejectedValueOnce(new Error("Error"));
                const logged= jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => next());
                const isAdminOrManager = jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req: any, res: any, next: any) => next());

                const response = await request(app).delete(baseURL + "/reviews");

                expect(response.status).not.toBe(200);
                expect(logged).toHaveBeenCalledTimes(1);
                expect(isAdminOrManager).toHaveBeenCalledTimes(1);
                expect(deleteAllReviews).toHaveBeenCalledTimes(1);

            })
        })
    
})