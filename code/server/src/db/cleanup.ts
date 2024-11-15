"use strict"

import db from "../db/db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

export async function cleanup() {
    /*function deleteAll():Promise<void>{
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                // Delete all data from the database.
                db.run("DELETE FROM users");
                //Add delete statements for other tables here
                db.run("DELETE FROM productInCart");
                db.run("DELETE FROM products");
                db.run("DELETE FROM carts");
                db.run("DELETE FROM reviews",(err) => { if(err) reject(err); else resolve();});
            });
        });
    }

    return deleteAll();
    deleteAll().then(()=>console.log("Clean-up")).catch((err) => console.log(err));*/
    db.run("DELETE FROM users", (err) => { if(err) console.log(err);
        db.run("DELETE FROM productInCart", (err) => { if(err) console.log(err);
            db.run("DELETE FROM products", (err) => { if(err) console.log(err);
                db.run("DELETE FROM carts", (err) => { if(err) console.log(err);
                    db.run("DELETE FROM reviews", (err) => { if(err) console.log(err);
                        //console.log("Clean-up");
                    });
                });
            });
        });
    });
}