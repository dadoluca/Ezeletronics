import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"

import ReviewController from "../../src/controllers/reviewController"
import { Role, User } from "../../src/components/user";
import { Category, Product } from "../../src/components/product";
import { ProductReview } from "../../src/components/review";
import ReviewDAO from "../../src/dao/reviewDAO";
import ProductDAO from "../../src/dao/productDAO";
import { ProductNotFoundError } from "../../src/errors/productError";
import exp from "constants";
import ProductController from "../../src/controllers/productController";
import CartDAO from "../../src/dao/cartDAO";

jest.mock("../../src/dao/reviewDAO");


let testUserCustomer1 = new User("customerUser1","Customer1","User",Role.CUSTOMER,"","");
let testUserCustomer2 = new User("customerUser1","Customer2","User",Role.CUSTOMER,"","");

let testProduct1 = new Product(449.99,"Pixel 7a",Category.SMARTPHONE,"2024-06-01","...",1);
let testProduct2 = new Product(899.99,"MacBook Air",Category.LAPTOP,"2024-05-25","...",0);
let testProduct3 = new Product(499.99,"whirlpoolFridge",Category.APPLIANCE,"2024-05-20","...",5);

let testReview1 = new ProductReview(testProduct1.model,testUserCustomer1.username,4,"2024-05-30","Non male");
let testReview2 = new ProductReview(testProduct1.model,testUserCustomer2.username,5,"2024-06-03","Fantastico!");

describe("Review controller unit tests", () => {
    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    describe("addReview", () => {

        test("Should add product to cart, with product in DB", async () => {
            jest.spyOn(ProductDAO.prototype,"isProductInDB").mockResolvedValue(true);
            jest.spyOn(ReviewDAO.prototype,"addReview").mockResolvedValue();

            const controller = new ReviewController();
            const added = await controller.addReview(testProduct1.model,testUserCustomer1,testReview1.score,testReview1.comment);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct1.model)
            expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(testProduct1.model,testUserCustomer1,testReview1.score,testReview1.comment);

            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ReviewDAO.prototype.addReview).toBeCalledTimes(1);

        })

        test("Should return ProductNotFoundError", async () => {
            jest.spyOn(ProductDAO.prototype,"isProductInDB").mockResolvedValue(false);


            const controller = new ReviewController();
            await expect(controller.addReview(testProduct1.model,testUserCustomer1,testReview1.score,testReview1.comment)).rejects.toThrowError(ProductNotFoundError);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct1.model)
            expect(ReviewDAO.prototype.addReview).not.toHaveBeenCalledWith(testProduct1.model,testUserCustomer1,testReview1.score,testReview1.comment);

            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ReviewDAO.prototype.addReview).not.toHaveBeenCalled();

        })

        test("Should return an error", async () => {
            jest.spyOn(ProductDAO.prototype,"isProductInDB").mockRejectedValue(new Error("Dao error"));

            const controller = new ReviewController();
            await expect(controller.addReview(testProduct1.model,testUserCustomer1,testReview1.score,testReview1.comment)).rejects.toThrow();

            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct1.model);
            expect(ReviewDAO.prototype.addReview).not.toBeCalled();

        })

    })

    describe("getProductReviews", () => {
        test("Should return a list of product reviews", async () => {
            const expectedReviewList = [testReview1,testReview2];
            jest.spyOn(ReviewDAO.prototype,"getProductReviews").mockResolvedValue(expectedReviewList);
            jest.spyOn(ProductDAO.prototype,"isProductInDB").mockResolvedValue(true);

            const controller = new ReviewController();
            const returnedReviewList = await controller.getProductReviews(testProduct1.model);
            expect(returnedReviewList).toBe(expectedReviewList);

            expect(ReviewDAO.prototype.getProductReviews).toBeCalledTimes(1);
        })

        test ("Should return an error", async () => {
            jest.spyOn(ReviewDAO.prototype,"getProductReviews").mockRejectedValue(new Error("DAO error"));

            const controller = new ReviewController();
            await expect(controller.getProductReviews(testProduct1.model)).rejects.toThrow();

            return expect(ReviewDAO.prototype.getProductReviews).not.toHaveBeenCalled();
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(testProduct1.model);
            expect(ReviewDAO.prototype.getProductReviews).toBeCalledTimes(1);
        })
    })

    describe("deleteReview",() => {
        test("Should delete reviews by user and model", async () => {
            jest.spyOn(ProductDAO.prototype,"isProductInDB").mockResolvedValue(true);
            jest.spyOn(ReviewDAO.prototype,"existReview").mockResolvedValue();
            jest.spyOn(ReviewDAO.prototype,"deleteReview").mockResolvedValue();

            const controller = new ReviewController();
            await controller.deleteReview(testProduct1.model,testUserCustomer1)


            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ReviewDAO.prototype.existReview).toBeCalledTimes(1);
            expect(ReviewDAO.prototype.deleteReview).toBeCalledTimes(1);
        })

        test("Should return a ProductNotFoundError",async () => {
            jest.spyOn(ProductDAO.prototype,"isProductInDB").mockResolvedValue(false);

            const controller = new ReviewController();
            await expect(controller.deleteReview(testProduct1.model,testUserCustomer1)).rejects.toThrow(ProductNotFoundError);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct1.model);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledTimes(1);
        })

        test("Should return an error", async () => {
            jest.spyOn(ReviewDAO.prototype,"deleteReview").mockRejectedValue(new Error("DAO error"));

            const controller = new ReviewController();
            await expect(controller.deleteReview(testProduct1.model,testUserCustomer1)).rejects.toThrow();

            expect(ReviewDAO.prototype.deleteReview).not.toBeCalledTimes(1);
        })

        describe("deleteReviewsOfProduct", () => {
            test ("deleteReviewsOfProduct", async () => {
                jest.spyOn(ProductDAO.prototype,"isProductInDB").mockResolvedValue(true);
                jest.spyOn(ReviewDAO.prototype,"deleteReviewsOfProduct").mockResolvedValue();

                const controller = new ReviewController();
                await controller.deleteReviewsOfProduct(testProduct1.model);


                expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
                expect(ReviewDAO.prototype.deleteReviewsOfProduct).toBeCalledTimes(1);

            })

            test("Should return a ProductNotFoundError", async () => {
                jest.spyOn(ProductDAO.prototype,"isProductInDB").mockResolvedValue(false);

                const controller = new ReviewController();
                await expect(controller.deleteReviewsOfProduct(testProduct1.model)).rejects.toThrow(ProductNotFoundError);

                expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct1.model);

                expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledTimes(1);
            })

            test("Should return an error", async () => {
                jest.spyOn(ReviewDAO.prototype,"deleteReviewsOfProduct").mockRejectedValue(new Error("DAO error"));

                const controller = new ReviewController();
                await expect(controller.deleteReviewsOfProduct(testProduct1.model)).rejects.toThrow();

                expect(ReviewDAO.prototype.deleteReviewsOfProduct).not.toBeCalledTimes(1);
            })

        })

        describe("deleteAllReviews", () => {
            test("Should delete all reviews", async () => {
                jest.spyOn(ReviewDAO.prototype,"deleteAllReviews").mockResolvedValue();

                const controller = new ReviewController();
                await controller.deleteAllReviews();


                expect(ReviewDAO.prototype.deleteAllReviews).toBeCalledTimes(1);
            })

            test("Should return an error", async() => {
                jest.spyOn(ReviewDAO.prototype,"deleteAllReviews").mockRejectedValue(new Error("DAO error"));

                const controller = new ReviewController();
                await expect(controller.deleteAllReviews()).rejects.toThrow();

                expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledWith();
                expect(ReviewDAO.prototype.deleteAllReviews).toBeCalledTimes(1);

            })
        })



    })
})