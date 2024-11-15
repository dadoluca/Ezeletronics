import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"

import db from "../../src/db/db"
import {ProductReview} from "../../src/components/review"
import ReviewController from "../../src/controllers/reviewController"
import { cleanup } from "../../src/db/cleanup"
import { Role, User } from "../../src/components/user"
import dayjs from "dayjs"
import { ProductNotFoundError } from "../../src/errors/productError"
import { ExistingReviewError } from "../../src/errors/reviewError"

beforeAll(async() => {
    await cleanup();
    db.serialize(() => {
        db.run(`INSERT INTO users (username, password, salt, role, name, surname, birthdate, address) VALUES
        ('frossi', '', '', 'Customer', 'Francesca', 'Rossi', NULL, NULL),
        ('mverdi', '', '', 'Customer', 'Mario', 'Verdi',  NULL, NULL),
        ('gconti', '', '', 'Customer', 'Giulia', 'Conti', NULL, NULL),
        ('lbianchi', '', '', 'Customer', 'Luca', 'Bianchi', NULL, NULL),
        ('mrossi', '', '', 'Customer', 'Maria', 'Rossi', NULL, NULL),
        ('sferrari', '', '', 'Customer', 'Sara', 'Ferrari', NULL, NULL),
        ('vrossi', '', '', 'Customer', 'Valeria', 'Rossi', NULL, NULL);`);

        db.run(`INSERT INTO products (model, sellingPrice, category, arrivalDate, details, quantity, visible) VALUES
        ('iPad21', 500.00, 'Smartphone', '2024-06-14', 'Apple', 3, TRUE),
        ('samsungS21', 500.00, 'Smartphone', '2024-06-14', 'Samsung', 3, TRUE);`)

        db.run(`INSERT INTO reviews (model, username, score, comment,date) VALUES
        ('iPad21', 'mrossi', 5, 'Bellissimo!', '2024-06-10');`);

    })
})

describe("Review Controller-DAO-DB integration tests", () => {

    describe("addReview",()=> {
        test("Should add a review to a product.", async() => {
            const reviewController = new ReviewController();
            const user = new User('frossi','Francesca','Rossi',Role.CUSTOMER,'via Prova','1998-12-01')
            await reviewController.addReview('samsungS21',user,4,'Inutile');
            const result = await reviewController.getProductReviews('samsungS21');
            expect(result).toEqual([new ProductReview('samsungS21','frossi',4,dayjs().format("YYYY-MM-DD"),'Inutile')]);
        })

        test("Should return an error if the product does not exist", async() => {
            const reviewController = new ReviewController();
            const user = new User('frossi','Francesca','Rossi',Role.CUSTOMER,'via Prova','1998-12-01')
            await expect(reviewController.addReview('iPad22',user,4,'Inutile')).rejects.toThrowError(new ProductNotFoundError);
        })

        test("Should return an error if the review already exists", async() => {
            const reviewController = new ReviewController();
            const user = new User('mrossi','Maria','Rossi',Role.CUSTOMER,'via Prova','1998-12-01')
            await expect(reviewController.addReview('iPad21',user,5,'Wow')).rejects.toThrowError(new ExistingReviewError);
        })
    })

    describe("getProductReviews",() => {

        test("Should retrieve all reviews of a product",async() => {
            const reviewController = new ReviewController();
            const result = await reviewController.getProductReviews('iPad21');
            expect(result).toEqual([new ProductReview('iPad21','mrossi',5,'2024-06-10','Bellissimo!')])
        })

        test("Should return a void list if the product does not exist", async() => {
            const reviewController = new ReviewController();
            return expect(reviewController.getProductReviews('iPad22')).rejects.toThrowError(new ProductNotFoundError);
            const result = await reviewController.getProductReviews('iPad22');
            expect(result).toEqual([]);
        })
    })

    describe("deleteReview",()=> {
        test("Should delete the review made by a user for one product", async() => {
            const reviewController = new ReviewController();
            const user = new User('mrossi','Maria','Rossi',Role.CUSTOMER,'via Prova','1998-12-01')
            await reviewController.deleteReview('iPad21',user);
            const result = await reviewController.getProductReviews('iPad21');
            expect(result).toEqual([]);
        })

        test("Should return an error if the product does not exist", async() => {
            const reviewController = new ReviewController();
            const user = new User('mrossi','Maria','Rossi',Role.CUSTOMER,'via Prova','1998-12-01')
            await expect(reviewController.deleteReview('iPad22',user)).rejects.toThrowError(new ProductNotFoundError);
        })

        test("Should return an error if the review does not exist", async() => {
            const reviewController = new ReviewController();
            const user = new User('frossi','Francesca','Rossi',Role.CUSTOMER,'via Prova','1998-12-01')
            await expect(reviewController.deleteReview('iPad21',user)).rejects.toThrowError(new ProductNotFoundError);
        })
    })

    describe("deleteReviewsOfProduct",()=> {
        test ("Should delete all reviews for a product",async() => {
            const reviewController = new ReviewController();
            await reviewController.deleteReviewsOfProduct('iPad21');
            const result = await reviewController.getProductReviews('iPad21');
            expect(result).toEqual([]);
        })

        test("Should return an error if the product does not exist", async() => {
            const reviewController = new ReviewController();
            await expect(reviewController.deleteReviewsOfProduct('iPad22')).rejects.toThrowError(new ProductNotFoundError);
        })
    })

    describe("deleteAllReviews",()=> {
        test("Should delete all reviews of all products", async() =>{
            const reviewController = new ReviewController();
            await reviewController.deleteAllReviews();
            const result = await reviewController.getProductReviews('iPad21');
            expect(result).toEqual([]);
        })
    })
})