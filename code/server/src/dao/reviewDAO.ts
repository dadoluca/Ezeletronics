import db from "../db/db"
import { ProductReview } from "../components/review"
import { User } from "../components/user";
import dayjs from "dayjs"
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";
import { ProductNotFoundError } from "../errors/productError";

/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {

    /**
     * Adds a new review for a product
     * @param model The model of the product to review
     * @param user The username of the user who made the review
     * @param score The score assigned to the product, in the range [1, 5]
     * @param comment The comment made by the user
     * @returns A Promise that resolves to nothing
     */
    addReview(model: string, user: User, score: number, comment: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const sql = "INSERT INTO reviews(model, username, score, comment, date) VALUES(?, ?, ?, ?, ?)"
            db.run(sql, [model, user.username, score, comment, dayjs().format("YYYY-MM-DD")], function(err: Error | null){
                if(err){
                    if (err.message.includes("UNIQUE constraint failed: reviews.model, reviews.username"))
                        reject(new ExistingReviewError)
                    reject(err)
                }
                resolve()
            })
        })
    }

    /**
     * Returns all reviews made for a specific product
     * @param model The model of the product to get reviews from
     * @returns A Promise that resolves to an array of ProductReview objects
     */
    getProductReviews(model: string): Promise<ProductReview[]> {
        return new Promise<ProductReview[]>((resolve, reject) => {
            const sql = "SELECT * FROM reviews WHERE model = ?"
            db.all(sql, [model], (err: Error | null, rows: any[]) => {
                if(err)
                    reject(err)
                const product_reviews: ProductReview[] = rows.map(row => new ProductReview(row.model, row.username, row.score, row.date, row.comment))
                resolve(product_reviews)
            })
        })
    }

    /**
     * Checks if a review exists for a product made by a user
     * @param model The model of the product to check the review for
     * @param user The user who made the review
     * @returns A Promise that resolves to nothing
     */
    existReview(model: string, user: User): Promise<void> {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM reviews WHERE model = ? AND username = ?";
            db.get(sql, [model, user.username], (err, row) => {
                if (err) reject(err);
                else if (row === undefined) reject(new NoReviewProductError);
                else resolve();
            });
        });
    }

    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param user The user who made the review to delete
     * @returns A Promise that resolves to nothing
     */
    deleteReview(model: string, user: User): Promise<void> {
        return new Promise((resolve, reject) => {
            const sql = "DELETE FROM reviews WHERE model = ? AND username = ?";
            db.run(sql, [model, user.username], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */
    deleteReviewsOfProduct(model: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const sql = "DELETE FROM reviews WHERE model = ?";
            db.run(sql, [model], function(err: Error | null){
                if(err)
                    reject(err)
                resolve()
            });
        });
    }

    /**
     * Deletes all reviews of all products
     * @returns A Promise that resolves to nothing
     */
    deleteAllReviews(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const sql = "DELETE FROM reviews";
            db.run(sql, [], function(err: Error | null) {
                if(err)
                    reject(err);
                resolve();
            });
        });
    }
}



export default ReviewDAO;