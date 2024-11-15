import { test, expect, jest, describe, afterEach } from "@jest/globals";
import ProductController from "../../src/controllers/productController";
import ProductDAO from "../../src/dao/productDAO";
import { ProductAlreadyExistsError, ProductNotFoundError, LowProductStockError } from "../../src/errors/productError";
import { DateError } from "../../src/utilities";
import { Category, Product } from "../../src/components/product";

jest.mock("../../src/dao/productDAO");

describe("productController", () => {

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    describe("registerProducts", () => {

        test("should add a new product (product non already in the list)", async () => {
            const testProduct={
                model: "Dell XPS 13",
                category: "Laptop",
                quantity: 10,
                details: "Dell XPS 13, 16GB RAM, 512GB SSD",
                sellingPrice: 100,
                arrivalDate: "2024-01-01"
            }
            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(false);
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValue();

            const productController = new ProductController();
            await productController.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);

            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.registerProducts).toBeCalledTimes(1);

        });

        test("should return ProductAlreadyExistsError", async () => {
            const testProduct= new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100);

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(true);

            const productController = new ProductController();
            await expect(productController.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)).rejects.toThrow(ProductAlreadyExistsError);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.registerProducts).not.toHaveBeenCalled();
        });

        test("should return DateError", async () => {
            const testProduct= new Product(999,"Dell XPS 13", Category.LAPTOP, "2025-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100);

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(false);

            const productController = new ProductController();
            await expect(productController.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)).rejects.toThrow(DateError);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.registerProducts).not.toHaveBeenCalled();
        });

        test("should assign current date if arrivalDate is null", async () => {
            const testProduct=new Product(999,"Dell XPS 13", Category.LAPTOP, null, "Dell XPS 13, 16GB RAM, 512GB SSD", 100);

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(false);
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValue();

            const productController = new ProductController();
            await productController.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);

            
            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, expect.any(String));

            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.registerProducts).toBeCalledTimes(1);
        });

        test("should return an Error", async () => {
            const testProduct= new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100);

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockRejectedValue(new Error("Dao error"));

            const productController = new ProductController();
            await expect(productController.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)).rejects.toThrow();

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.registerProducts).not.toHaveBeenCalled();
        });
    });

    describe("changeProductQuantity", () => {

        test("should return the new available quantity (date inserted)", async () => {
            const testProduct1=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100);
            const testProduct2=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-02", "Dell XPS 13, 16GB RAM, 512GB SSD", 105);
            const newQuantity=5;
            const changeDate="2024-01-02";

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(true);
            jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(testProduct1).mockResolvedValueOnce(testProduct2);
            jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValue();

            const productController = new ProductController();
            const number = await productController.changeProductQuantity(testProduct1.model, newQuantity, changeDate);
            expect(number).toBe(testProduct1.quantity+newQuantity);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct1.model);
            expect(ProductDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct1.model);
            expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledWith(testProduct1.model, newQuantity);

            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.getProduct).toBeCalledTimes(2);
            expect(ProductDAO.prototype.changeProductQuantity).toBeCalledTimes(1);
        });

        test("should return the new available quantity (date not inserted)", async () => {
            const testProduct=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100);
            const testProduct2=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-06-03", "Dell XPS 13, 16GB RAM, 512GB SSD", 105);
            const newQuantity=5;
            const changeDate : null=null;

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(true);
            jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(testProduct).mockResolvedValueOnce(testProduct2);
            jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValue();

            const productController = new ProductController();
            const number = await productController.changeProductQuantity(testProduct.model, newQuantity, changeDate);
            expect(number).toBe(testProduct.quantity+newQuantity);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledWith(testProduct.model, newQuantity);

            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.getProduct).toBeCalledTimes(2);
            expect(ProductDAO.prototype.changeProductQuantity).toBeCalledTimes(1);
        });

        test("should return ProductNotFoundError", async () => {
            const testProduct=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100);
            const newQuantity=5;
            const changeDate="2024-01-02";

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(false);

            const productController = new ProductController();
            await expect(productController.changeProductQuantity(testProduct.model, newQuantity, changeDate)).rejects.toThrow(ProductNotFoundError);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.getProduct).not.toHaveBeenCalled();
            expect(ProductDAO.prototype.changeProductQuantity).not.toHaveBeenCalled();
        });

        test("should return DateError", async () => {
            const testProduct=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100);
            const newQuantity=5;
            const changeDate="2025-01-02";

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(true);
            jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValue(testProduct);

            const productController = new ProductController();
            await expect(productController.changeProductQuantity(testProduct.model, newQuantity, changeDate)).rejects.toThrow(DateError);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.getProduct).toBeCalledTimes(1);
            expect(ProductDAO.prototype.changeProductQuantity).not.toHaveBeenCalled();
        });

        test("should return an Error", async () => {
            const testProduct=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100);
            const newQuantity=5;
            const changeDate="2024-01-02";

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockRejectedValue(new Error("Dao error"));

            const productController = new ProductController();
            await expect(productController.changeProductQuantity(testProduct.model, newQuantity, changeDate)).rejects.toThrow();

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.getProduct).not.toHaveBeenCalled();
            expect(ProductDAO.prototype.changeProductQuantity).not.toHaveBeenCalled();
        });
    });

    describe("sellProduct", () => {

        test("should return the new available quantity (date inserted)", async () => {
            const testProduct1=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 5);
            const testProduct2=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-02", "Dell XPS 13, 16GB RAM, 512GB SSD", 0);
            const quantity=5;
            const sellingDate="2024-01-02";

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(true);
            jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(testProduct1).mockResolvedValueOnce(testProduct2);
            jest.spyOn(ProductDAO.prototype, "sellProduct").mockResolvedValue();

            const productController = new ProductController();
            const number = await productController.sellProduct(testProduct1.model, quantity, sellingDate);
            expect(number).toBe(testProduct1.quantity-quantity);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct1.model);
            expect(ProductDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct1.model);
            expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(testProduct1.model, quantity);

            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.getProduct).toBeCalledTimes(2);
            expect(ProductDAO.prototype.sellProduct).toBeCalledTimes(1);
        });

        test("should return the new available quantity (date not inserted)", async () => {
            const testProduct=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 5);
            const testProduct2=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-06-03", "Dell XPS 13, 16GB RAM, 512GB SSD", 0);
            const quantity=5;
            const sellingDate : null=null;

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(true);
            jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(testProduct).mockResolvedValueOnce(testProduct2);
            jest.spyOn(ProductDAO.prototype, "sellProduct").mockResolvedValue();

            const productController = new ProductController();
            const number = await productController.sellProduct(testProduct.model, quantity, sellingDate);
            expect(number).toBe(testProduct.quantity-quantity);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.getProduct).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(testProduct.model, quantity);

            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.getProduct).toBeCalledTimes(2);
            expect(ProductDAO.prototype.sellProduct).toBeCalledTimes(1);
        });
        
        test("should return ProductNotFoundError", async () => {
            const testProduct=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 5);
            const quantity=5;
            const sellingDate="2024-01-02";

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(false);

            const productController = new ProductController();
            await expect(productController.sellProduct(testProduct.model, quantity, sellingDate)).rejects.toThrow(ProductNotFoundError);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.getProduct).not.toHaveBeenCalled();
            expect(ProductDAO.prototype.sellProduct).not.toHaveBeenCalled();
        });
        
        test("should return DateError", async () => {
            const testProduct=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 5);
            const quantity=5;
            const sellingDate="2025-01-02";

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(true);
            jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValue(testProduct);

            const productController = new ProductController();
            await expect(productController.sellProduct(testProduct.model, quantity, sellingDate)).rejects.toThrow(DateError);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.getProduct).toBeCalledTimes(1);
            expect(ProductDAO.prototype.sellProduct).not.toHaveBeenCalled();
        });

        test("should return LowProductStockError", async () => {
            const testProduct=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 0);
            const quantity=5;
            const sellingDate="2024-01-02";

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(true);
            jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValue(testProduct);

            const productController = new ProductController();
            await expect(productController.sellProduct(testProduct.model, quantity, sellingDate)).rejects.toThrow(LowProductStockError);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.getProduct).toBeCalledTimes(1);
            expect(ProductDAO.prototype.sellProduct).not.toHaveBeenCalled();
        });

        test("should return an Error", async () => {
            const testProduct=new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100);
            const quantity=5;
            const sellingDate="2024-01-02";

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockRejectedValue(new Error("Dao error"));

            const productController = new ProductController();
            await expect(productController.sellProduct(testProduct.model, quantity, sellingDate)).rejects.toThrow();

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.getProduct).not.toHaveBeenCalled();
            expect(ProductDAO.prototype.changeProductQuantity).not.toHaveBeenCalled();
        });
    });

    describe("getProducts", () => {
    
        test("should return all products (grouping=null, category=null, model=null)", async () => {
            const products = [
                new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100),
                new Product(1000,"Iphone 13", Category.SMARTPHONE, "2024-01-01", "Iphone 13, 128GB, 5G", 90),
                new Product(699,"Samsung Galaxy S21", Category.SMARTPHONE, "2024-01-01", "Samsung Galaxy S21, 128GB, 5G", 50)
            ];
            const grouping : null= null;
            const category : null= null;
            const model : null= null;

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue(products);

            const productController = new ProductController();
            const result = await productController.getProducts(grouping, category, model);
            expect(result).toEqual(products);

            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledWith();
            expect(ProductDAO.prototype.getAllProducts).toBeCalledTimes(1);
            expect(ProductDAO.prototype.isProductInDB).not.toHaveBeenCalled();

        });

        test("should return all products filtered by category (grouping=category, category=Smartphone, model=null)", async () => {
            const products = [
                new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100),
                new Product(1000,"Iphone 13", Category.SMARTPHONE, "2024-01-01", "Iphone 13, 128GB, 5G", 90),
                new Product(699,"Samsung Galaxy S21", Category.SMARTPHONE, "2024-01-01", "Samsung Galaxy S21, 128GB, 5G", 50)
            ];
            const products2 = [
                new Product(1000,"Iphone 13", Category.SMARTPHONE, "2024-01-01", "Iphone 13, 128GB, 5G", 90),
                new Product(699,"Samsung Galaxy S21", Category.SMARTPHONE, "2024-01-01", "Samsung Galaxy S21, 128GB, 5G", 50)
            ];
            const grouping = "category";
            const category = "Smartphone";
            const model : null= null;

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue(products);

            const productController = new ProductController();
            const result = await productController.getProducts(grouping, category, model);
            expect(result).toEqual(products2);

            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledWith();
            expect(ProductDAO.prototype.getAllProducts).toBeCalledTimes(1);
            expect(ProductDAO.prototype.isProductInDB).not.toHaveBeenCalled();
        });

        test("should return the product with the specified model (grouping=model, category=null, model=Iphone 13, model exist)", async () => {
            const products = [
                new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100),
                new Product(1000,"Iphone 13", Category.SMARTPHONE, "2024-01-01", "Iphone 13, 128GB, 5G", 90),
                new Product(699,"Samsung Galaxy S21", Category.SMARTPHONE, "2024-01-01", "Samsung Galaxy S21, 128GB, 5G", 50)
            ];
            const products2 = [
                new Product(1000,"Iphone 13", Category.SMARTPHONE, "2024-01-01", "Iphone 13, 128GB, 5G", 90)
            ];
            const grouping = "model";
            const category : null= null;
            const model = "Iphone 13";

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue(products);
            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(true);

            const productController = new ProductController();
            const result = await productController.getProducts(grouping, category, model);
            expect(result).toEqual(products2);

            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledWith();
            expect(ProductDAO.prototype.getAllProducts).toBeCalledTimes(1);
            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
        });

        test("should return ProductNotFoundError (grouping=model, category=null, model=Iphone 14, model not exist)", async () => {
            const products = [
                new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100),
                new Product(1000,"Iphone 13", Category.SMARTPHONE, "2024-01-01", "Iphone 13, 128GB, 5G", 90),
                new Product(699,"Samsung Galaxy S21", Category.SMARTPHONE, "2024-01-01", "Samsung Galaxy S21, 128GB, 5G", 50)
            ];
            const grouping = "model";
            const category : null= null;
            const model = "Iphone 14";

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue(products);
            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(false);

            const productController = new ProductController();
            await expect(productController.getProducts(grouping, category, model)).rejects.toThrow(ProductNotFoundError);

            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledWith();
            expect(ProductDAO.prototype.getAllProducts).toBeCalledTimes(1);
            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
        });

        test("should return an Error", async () => {
            const grouping : null= null;
            const category : null= null;
            const model : null= null;

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockRejectedValue(new Error("Dao error"));

            const productController = new ProductController();
            await expect(productController.getProducts(grouping, category, model)).rejects.toThrow();

            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledWith();
            expect(ProductDAO.prototype.getAllProducts).toBeCalledTimes(1);
            expect(ProductDAO.prototype.isProductInDB).not.toHaveBeenCalled();
        });
    });

    describe("getAvailableProducts", () => {

        test("should return all available products (grouping=null, category=null, model=null)", async () => {
            const products = [
                new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100),
                new Product(1000,"Iphone 13", Category.SMARTPHONE, "2024-01-01", "Iphone 13, 128GB, 5G", 90),
                new Product(699,"Samsung Galaxy S21", Category.SMARTPHONE, "2024-01-01", "Samsung Galaxy S21, 128GB, 5G", 50),
                new Product(1200,"Iphone 14", Category.SMARTPHONE, "2024-01-01", "Iphone 14, 128GB, 5G", 0)
            ];
            const products2 = [
                new Product(999,"Dell XPS 13", Category.LAPTOP, "2024-01-01", "Dell XPS 13, 16GB RAM, 512GB SSD", 100),
                new Product(1000,"Iphone 13", Category.SMARTPHONE, "2024-01-01", "Iphone 13, 128GB, 5G", 90),
                new Product(699,"Samsung Galaxy S21", Category.SMARTPHONE, "2024-01-01", "Samsung Galaxy S21, 128GB, 5G", 50)
            ];
            const grouping : null= null;
            const category : null= null;
            const model : null= null;

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue(products);

            const productController = new ProductController();
            const result = await productController.getAvailableProducts(grouping, category, model);
            expect(result).toEqual(products2);

            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledWith();
            expect(ProductDAO.prototype.getAllProducts).toBeCalledTimes(1);
            expect(ProductDAO.prototype.isProductInDB).not.toHaveBeenCalled();
        });

        test("should return an Error", async () => {
            const grouping : null= null;
            const category : null= null;
            const model : null= null;

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockRejectedValue(new Error("Dao error"));

            const productController = new ProductController();
            await expect(productController.getAvailableProducts(grouping, category, model)).rejects.toThrow();

            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledWith();
            expect(ProductDAO.prototype.getAllProducts).toBeCalledTimes(1);
            expect(ProductDAO.prototype.isProductInDB).not.toHaveBeenCalled();
        });
    });

    describe("deleteAllProducts", () => {

        test("should return true", async () => {
            jest.spyOn(ProductDAO.prototype, "deleteProducts").mockResolvedValue();

            const productController = new ProductController();
            const result = await productController.deleteAllProducts();
            expect(result).toBe(true);

            expect(ProductDAO.prototype.deleteProducts).toHaveBeenCalledWith();
            expect(ProductDAO.prototype.deleteProducts).toBeCalledTimes(1);
        });

        test("should return an Error", async () => {
            jest.spyOn(ProductDAO.prototype, "deleteProducts").mockRejectedValue(new Error("Dao error"));

            const productController = new ProductController();
            await expect(productController.deleteAllProducts()).rejects.toThrow();

            expect(ProductDAO.prototype.deleteProducts).toHaveBeenCalledWith();
            expect(ProductDAO.prototype.deleteProducts).toBeCalledTimes(1);
        });
    });

    describe("deleteProduct", () => {

        test("should return true", async () => {
            const model = "Iphone 13";

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(true);
            jest.spyOn(ProductDAO.prototype, "deleteProduct").mockResolvedValue();

            const productController = new ProductController();
            const result = await productController.deleteProduct(model);
            expect(result).toBe(true);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledWith(model);
            expect(ProductDAO.prototype.deleteProduct).toBeCalledTimes(1);
        });

        test("should return ProductNotFoundError", async () => {
            const model = "Iphone 14";

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockResolvedValue(false);

            const productController = new ProductController();
            await expect(productController.deleteProduct(model)).rejects.toThrow(ProductNotFoundError);

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.deleteProduct).not.toHaveBeenCalled();
        });

        test("should return an Error", async () => {
            const model = "Iphone 13";

            jest.spyOn(ProductDAO.prototype, "isProductInDB").mockRejectedValue(new Error("Dao error"));

            const productController = new ProductController();
            await expect(productController.deleteProduct(model)).rejects.toThrow();

            expect(ProductDAO.prototype.isProductInDB).toHaveBeenCalledWith(model);
            expect(ProductDAO.prototype.isProductInDB).toBeCalledTimes(1);
            expect(ProductDAO.prototype.deleteProduct).not.toHaveBeenCalled();
        });
    });
});