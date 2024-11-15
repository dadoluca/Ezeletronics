import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import ReviewDAO from '../../src/dao/reviewDAO'

import db from "../../src/db/db"
import {ProductReview} from "../../src/components/review"
import { cleanup } from "../../src/db/cleanup"
import { Role, User } from "../../src/components/user"

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
        ('iPad21', 500.00, 'Smartphone', '2024-06-14', 'Apple', 3, TRUE);`)

        db.run(`INSERT INTO reviews (model, username, score, comment,date) VALUES
        ('iPad21', 'mrossi', 5, 'Bellissimo!', '2024-06-10');`);

    })
})

describe("Review DAO-db integration tests", () => {

    describe("getProductReviews",() => {
            test("Should retrieve all reviews of a product",async() => {
                const reviewDAO = new ReviewDAO();
                const result = await reviewDAO.getProductReviews('iPad21');
                expect(result).toEqual([new ProductReview('iPad21','mrossi',5,'2024-06-10','Bellissimo!')
                ]);
        })
    })

    describe("addReview",()=> {
        test("Should add a review to a product.", async() => {
            const reviewDAO = new ReviewDAO();
            const user = new User('frossi','Francesca','Rossi',Role.CUSTOMER,'via Prova','1998-12-01')
            const result = await reviewDAO.addReview('iPad21',user,4,'Inutile');
            expect(200);
        })
    })

    describe("deleteReview",()=> {
        test("Should delete the review made by a user for one product", async() => {
            const reviewDAO = new ReviewDAO();
            const user = new User('frossi','Francesca','Rossi',Role.CUSTOMER,'via Prova','1998-12-01')
            const result = await reviewDAO.deleteReview('iPad21',user);
            expect(result);

        })
    })

    describe("deleteReviewsOfProduct",()=> {
        test ("Should delete all reviews for a product",async() => {
            const reviewDAO = new ReviewDAO();
            const result = reviewDAO.deleteReviewsOfProduct('iPad21');
            expect(result);
        })
    })

    describe("deleteAllReviews",()=> {
        test("Should delete all reviews of all products", async() =>{
            const reviewDAO = new ReviewDAO();
            const result = reviewDAO.deleteAllReviews();
            expect(result)

        })
    })
})
