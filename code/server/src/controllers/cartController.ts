import dayjs from "dayjs";
import { User } from "../components/user";
import { Cart } from "../components/cart";
import { Product } from "../components/product";
import CartDAO from "../dao/cartDAO";
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from "../errors/cartError";
import { ProductNotFoundError, EmptyProductStockError, LowProductStockError } from "../errors/productError";
import { UnauthorizedUserError, UserNotCustomerError } from "../errors/userError";

/**
 * Represents a controller for managing shopping carts.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class CartController {
    private dao: CartDAO

    constructor() {
        this.dao = new CartDAO
    }

    /**
     * Adds a product to the user's cart. If the product is already in the cart, the quantity should be increased by 1.
     * If the product is not in the cart, it should be added with a quantity of 1.
     * If there is no current unpaid cart in the database, then a new cart should be created.
     * @param user - The user to whom the product should be added.
     * @param productId - The model of the product to add.
     * @returns A Promise that resolves to `true` if the product was successfully added.
     */
    async addToCart(user: User, product: string): Promise<Boolean> {
        try {
            const p: Product = await this.dao.getProduct(product);
            if (p.quantity === 0) {
                throw new EmptyProductStockError;
            }
    
            const exists: boolean = await this.dao.hasCurrCart(user.username);
            if (!exists) {
                await this.dao.addEmptyCart(user.username);
            }
    
            const cartId: number = await this.dao.getCurrCartId(user.username);
    
            const inCart: boolean = await this.dao.isProductInCart(product, cartId);
            if (inCart) {
                await this.dao.updateQuantity(product, cartId, 1);
                await this.dao.updateTotal(cartId, p.sellingPrice);
            } else {
                await this.dao.addProductInCart(product, cartId);
                await this.dao.updateTotal(cartId, p.sellingPrice);
            }
    
            return true;

        } catch (error) {
            throw error;
        }
    }


    /**
     * Retrieves the current cart for a specific user.
     * @param user - The user for whom to retrieve the cart.
     * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
     */
    async getCart(user: User): Promise<Cart> {
        return this.dao.getCurrCart(user.username);
    }

    /**
     * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
     * @param user - The user whose cart should be checked out.
     * @returns A Promise that resolves to `true` if the cart was successfully checked out.
     * 
     */
    async checkoutCart(user: User):Promise<Boolean> {
        try {
            const exists: boolean = await this.dao.hasCurrCart(user.username);
            if (!exists) {
                throw new CartNotFoundError;
            }
    
            const cart: Cart = await this.dao.getCurrCart(user.username);
            if (cart.products.length === 0) {
                throw new EmptyCartError;
            }
    
            for (const p of cart.products) {
                const product: Product = await this.dao.getProduct(p.model);
                if (product.quantity === 0) {
                    throw new EmptyProductStockError;
                }
                if (p.quantity > product.quantity) {
                    throw new LowProductStockError;
                }
    
                await this.dao.updateStock(product.model, p.quantity);
            }
            
            const cartId: number = await this.dao.getCurrCartId(user.username);
            await this.dao.setPayment(cartId, dayjs().format('YYYY-MM-DD'));
    
            return true;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Retrieves all paid carts for a specific customer.
     * @param user - The customer for whom to retrieve the carts.
     * @returns A Promise that resolves to an array of carts belonging to the customer.
     * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
     */
    async getCustomerCarts(user: User):Promise<Cart[]>  {
        return this.dao.getPaidCarts(user.username);
    } 

    /**
     * Removes one product unit from the current cart. In case there is more than one unit in the cart, only one should be removed.
     * @param user The user who owns the cart.
     * @param product The model of the product to remove.
     * @returns A Promise that resolves to `true` if the product was successfully removed.
     */
    async removeProductFromCart(user: User, product: string):Promise<Boolean> {
        try {
            const exists: boolean = await this.dao.hasCurrCart(user.username);
            if (!exists) {
                throw new CartNotFoundError;
            }
    
            const elem: Product = await this.dao.getProduct(product);
            const price: number = elem.sellingPrice;
            const cartId: number = await this.dao.getCurrCartId(user.username);
    
            const inCart: boolean = await this.dao.isProductInCart(product, cartId);
            if (!inCart) {
                throw new ProductNotInCartError;
            }
    
            await this.dao.updateQuantity(product, cartId, -1);
    
            await this.dao.updateTotal(cartId, -price);
    
            return true;

        } catch (error) {
            throw error;
        }
    }


    /**
     * Removes all products from the current cart.
     * @param user - The user who owns the cart.
     * @returns A Promise that resolves to `true` if the cart was successfully cleared.
     */
    async clearCart(user: User):Promise<Boolean> {
        try {
            const exists: boolean = await this.dao.hasCurrCart(user.username);
            if (!exists) {
                throw new CartNotFoundError;
            }
    
            const cartId: number = await this.dao.getCurrCartId(user.username);
    
            await this.dao.emptyCart(cartId);
    
            return true;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Deletes all carts of all users.
     * @returns A Promise that resolves to `true` if all carts were successfully deleted.
     */
    async deleteAllCarts():Promise<Boolean> {
        await this.dao.deleteCarts();
        return true;
    }

    /**
     * Retrieves all carts in the database.
     * @returns A Promise that resolves to an array of carts.
     */
    async getAllCarts():Promise<Cart[]>  {
        return this.dao.getCarts();
    }
}

export default CartController