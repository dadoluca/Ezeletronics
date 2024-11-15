import dayjs from "dayjs";
import { Category, Product } from "../components/product";
import ProductDAO from "../dao/productDAO";
import { LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../errors/productError";
import { DateError } from "../utilities";
/**
 * Represents a controller for managing products.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class ProductController {
    private dao: ProductDAO

    constructor() {
        this.dao = new ProductDAO
    }

    /**
     * Registers a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional date in which the product arrived.
     * @returns A Promise that resolves to nothing.
     */
    async registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null) :Promise<void> {
        //if(model.trim()=="" || !(["Appliance","Laptop","Smartphone"].includes(category)) || quantity<=0 || sellingPrice<=0 || (arrivalDate!=null&&!dayjs(arrivalDate).isValid())) return Promise.reject({error: "Unprocessable Content", status:422});
        try{
            const present = await this.dao.isProductInDB(model);
            if (present) return Promise.reject(new ProductAlreadyExistsError());
            let date=arrivalDate==null?dayjs().format("YYYY-MM-DD"):arrivalDate;
            if (dayjs(date).isAfter(dayjs())) return Promise.reject(new DateError());
            await this.dao.registerProducts(model,category,quantity,details,sellingPrice,date);
            return Promise.resolve()
        }
        catch(err){
            return Promise.reject(err);
        }
     }

    /**
     * Increases the available quantity of a product through the addition of new units.
     * @param model The model of the product to increase.
     * @param newQuantity The number of product units to add. This number must be added to the existing quantity, it is not a new total.
     * @param changeDate The optional date in which the change occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async changeProductQuantity(model: string, newQuantity: number, changeDate: string | null) :Promise<number> { 
        //if(model.trim()=="" || newQuantity<=0 || (changeDate!=null&&!dayjs(changeDate).isValid())) return Promise.reject({error: "Unprocessable Content", status:422});
        try{
            const present = await this.dao.isProductInDB(model);
            if (!present) return Promise.reject(new ProductNotFoundError());
            const date=changeDate===null?dayjs().format("YYYY-MM-DD"):changeDate;
            let product = await this.dao.getProduct(model);
            if (dayjs(date).isAfter(dayjs())|| dayjs(date).isBefore(dayjs(product.arrivalDate))) return Promise.reject(new DateError());
            await this.dao.changeProductQuantity(model,newQuantity);
            product = await this.dao.getProduct(model);
            return Promise.resolve(product.quantity);
        }
        catch(err){
            return Promise.reject(err);
        }
    }

    /**
     * Decreases the available quantity of a product through the sale of units.
     * @param model The model of the product to sell
     * @param quantity The number of product units that were sold.
     * @param sellingDate The optional date in which the sale occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async sellProduct(model: string, quantity: number, sellingDate: string | null) :Promise<number> {
        //if(model.trim()=="" || quantity<=0 || (sellingDate!=null&&!dayjs(sellingDate).isValid())) return Promise.reject({error: "Unprocessable Content", status:422});
        try{
            const present = await this.dao.isProductInDB(model);
            if (!present) return Promise.reject(new ProductNotFoundError());
            let date=sellingDate===null?dayjs().format("YYYY-MM-DD"):sellingDate;
            let product = await this.dao.getProduct(model);
            if (dayjs(date).isAfter(dayjs())|| dayjs(date).isBefore(dayjs(product.arrivalDate))) return Promise.reject(new DateError());
            if (product.quantity==0 || product.quantity<quantity) return Promise.reject(new LowProductStockError());
            await this.dao.sellProduct(model,quantity);
            product= await this.dao.getProduct(model);
            return Promise.resolve(product.quantity);
        }
        catch (err){
            return Promise.reject(err);
        }
     }

    /**
     * Returns all products in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getProducts(grouping: string | null, category: string | null, model: string | null) :Promise<Product[]> {
        //if(!(["category","model"].includes(grouping)||grouping==null) || !(["Appliance","Laptop","Smartphone"].includes(category)||category==null) || (model!=null&&model.trim()==="") 
        //    || (grouping==null && (category!=null || model!=null)) || (grouping==="category" && (category==null || model!=null))
        //    || (grouping==="model" && (category!=null || model==null))) return Promise.reject({error: "Unprocessable Content", status:422});
        try{
            const products = await this.dao.getAllProducts();
            if(grouping==null) return Promise.resolve(products);
            else if(grouping==='category') return Promise.resolve(products.filter(p=>p.category==category));
            else {
                const present= await this.dao.isProductInDB(model);
                if (present) return Promise.resolve(products.filter(p=>p.model==model));
                else return Promise.reject(new ProductNotFoundError());
            }
        }
        catch(err){
            return Promise.reject(err);
        }
     }

    /**
     * Returns all available products (with a quantity above 0) in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getAvailableProducts(grouping: string | null, category: string | null, model: string | null) :Promise<Product[]>  { 
        try {
            const products = await this.getProducts(grouping,category,model);
            return Promise.resolve(products.filter(p=>p.quantity>0));
        }
        catch (err){
            return Promise.reject(err);
        }
    }

    /**
     * Deletes all products.
     * @returns A Promise that resolves to `true` if all products have been successfully deleted.
     */
    async deleteAllProducts() :Promise <Boolean> {
        try {
            await this.dao.deleteProducts();
            return Promise.resolve(true);
        }
        catch(err){
            return Promise.reject(err);
        }
     }


    /**
     * Deletes one product, identified by its model
     * @param model The model of the product to delete
     * @returns A Promise that resolves to `true` if the product has been successfully deleted.
     */
    async deleteProduct(model: string) :Promise <Boolean> { 
        try{
            const present = await this.dao.isProductInDB(model);
            if (present) {
                await this.dao.deleteProduct(model);
                return Promise.resolve(true);
            }
            else return Promise.reject(new ProductNotFoundError());
        }
        catch(err){
            return Promise.reject(err)
        }
    }

}

export default ProductController;