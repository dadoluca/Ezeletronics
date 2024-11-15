
/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
import db from "../db/db"
import { Category, Product } from "../components/product";
class ProductDAO {

    getProduct(model:string):Promise<Product>{
        return new Promise((resolve,reject)=>{
            const sql="SELECT model,category,quantity,details,sellingPrice,arrivalDate FROM products WHERE model=? AND visible=1";
            db.get(sql,[model],(err:Error|null,row:any)=>{
                if (err) reject(err);
                resolve(new Product(row.sellingPrice,row.model,row.category,row.arrivalDate,row.details,row.quantity))
            })
        })
    }
    
    isProductInDB(model:string):Promise<boolean>{
        return new Promise((resolve,reject)=>{
            const sql="SELECT COUNT(*) as c FROM products WHERE model=? AND visible=1";
            db.get(sql,[model],(err:Error|null,row:any)=>{
                if (err) reject(err);
                else if (row.c===1) resolve(true);
                else resolve(false)
            })
        });
    }

    registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null):Promise<void>{
        return new Promise((resolve,reject)=>{
            const sql="SELECT COUNT(*) as c FROM products WHERE model=? AND visible=0";
            db.get(sql,[model],(err:Error|null,row:any)=>{
                if (err) reject(err);
                if (row.c===1) {
                    const sql="UPDATE products SET category=?,quantity=?,details=?,sellingPrice=?,arrivalDate=?,visible=1 WHERE model=?";
                    db.run(sql,[category,quantity,details,sellingPrice,arrivalDate,model],(err:Error|null,row:any)=>{
                        if (err) reject(err);
                        else resolve()
                    })
                }
                else {
                    const sql="INSERT INTO products(model,category,quantity,details,sellingPrice,arrivalDate,visible) VALUES(?,?,?,?,?,?,1) ";
                    db.run(sql,[model,category,quantity,details,sellingPrice,arrivalDate],(err:Error|null,row:any)=>{
                        if (err) reject(err);
                        else resolve()
                    })
                }
            });
        })
    }

    changeProductQuantity(model: string, newQuantity: number):Promise<void>{
        return new Promise((resolve,reject)=>{
            const sql="UPDATE products SET quantity=quantity+? WHERE model=?";
            db.run(sql,[newQuantity,model],(err:Error|null,row:any)=>{
                if (err) reject(err);
                resolve();
            })
            
        })
    }

    sellProduct(model: string, quantity: number):Promise<void>{
        return new Promise((resolve,reject)=>{
            
            const sql="UPDATE products SET quantity=quantity-? WHERE model=?";
            db.run(sql,[quantity,model],(err:Error|null,row:any)=>{
                if (err) reject(err);
                resolve()
            })
        })
    }
    
    getAllProducts():Promise<Product[]>{
        return new Promise((resolve,reject)=>{
            const sql="SELECT model,category,quantity,details,sellingPrice,arrivalDate FROM products WHERE visible=1";
            db.all(sql,[],(err:Error|null,rows:any)=>{
                if (err) reject(err);
                const products= rows.map((r: { sellingPrice: number; model: string; category: Category; arrivalDate: string; details: string; quantity: number; })=>new Product(r.sellingPrice,r.model,r.category,r.arrivalDate,r.details,r.quantity))
                resolve(products)
            })
        })
    }
    deleteProducts():Promise<void>{
        return new Promise((resolve,reject)=>{
            const sql="UPDATE products SET visible=0";
            db.run(sql,[],(err:Error|null)=>{
                if(err) reject(err);
                resolve()
            })
        })
    }
    deleteProduct(model:string):Promise<void>{
        return new Promise((resolve,reject)=>{
            const sql="UPDATE products SET visible=0 WHERE model=?";
            db.run(sql,[model],(err:Error|null)=>{
                if(err) reject(err);
                resolve()
            })
        })
    }
}

export default ProductDAO