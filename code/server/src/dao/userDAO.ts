import db from "../db/db"
import { Role, User } from "../components/user"
import crypto from "crypto"
import { UnauthorizedUserError, UserAlreadyExistsError, UserNotFoundError } from "../errors/userError";
import { time } from "console";
import { rejects } from "assert";
import { resolve } from "path";

/**
 * A class that implements the interaction with the database for all user-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class UserDAO {

    /**
     * Checks whether the information provided during login (username and password) is correct.
     * @param username The username of the user.
     * @param plainPassword The password of the user (in plain text).
     * @returns A Promise that resolves to true if the user is authenticated, false otherwise.
     */
    getIsUserAuthenticated(username: string, plainPassword: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            /**
             * Example of how to retrieve user information from a table that stores username, encrypted password and salt (encrypted set of 16 random bytes that ensures additional protection against dictionary attacks).
             * Using the salt is not mandatory (while it is a good practice for security), however passwords MUST be hashed using a secure algorithm (e.g. scrypt, bcrypt, argon2).
             */
            const sql = "SELECT username, password, salt FROM users WHERE username = ?"
            db.get(sql, [username], (err: Error | null, row: any) => {
                if (err) reject(err)
                //If there is no user with the given username, or the user salt is not saved in the database, the user is not authenticated.
                if (!row || row.username !== username || !row.salt) {
                    resolve(false)
                } else {
                    //Hashes the plain password using the salt and then compares it with the hashed password stored in the database
                    const hashedPassword = crypto.scryptSync(plainPassword, row.salt, 16)
                    const passwordHex = Buffer.from(row.password, "hex")
                    if (!crypto.timingSafeEqual(passwordHex, hashedPassword)) resolve(false)
                    resolve(true)
                }

            })
        });
    }

    /**
     * Creates a new user and saves their information in the database
     * @param username The username of the user. It must be unique.
     * @param name The name of the user
     * @param surname The surname of the user
     * @param password The password of the user. It must be encrypted using a secure algorithm (e.g. scrypt, bcrypt, argon2)
     * @param role The role of the user. It must be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    createUser(username: string, name: string, surname: string, password: string, role: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const salt = crypto.randomBytes(16)
            const hashedPassword = crypto.scryptSync(password, salt, 16)
            const sql = "INSERT INTO users(username, name, surname, role, password, salt) VALUES(?, ?, ?, ?, ?, ?)"
            db.run(sql, [username, name, surname, role, hashedPassword, salt], (err: Error | null) => {
                if (err) {
                    if (err.message.includes("UNIQUE constraint failed: users.username")) reject(new UserAlreadyExistsError)
                    reject(err)
                }
                resolve(true)
            })
        })
    }

    /**
     * Returns a user object from the database based on the username.
     * @param username The username of the user to retrieve
     * @returns A Promise that resolves the information of the requested user
     */
    getUserByUsername(username: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            const sql = "SELECT * FROM users WHERE username = ?"
            db.get(sql, [username], (err: Error | null, row: any) => {
                if (err) {
                    reject(err)
                    return
                }
                if (!row) {
                    reject(new UserNotFoundError())
                    return
                }
                const user: User = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)
                resolve(user)
            })
        })
    }

    getUsers():Promise<User[]>{
        return new Promise<User[]>((resolve, reject) => {
            const sql = "SELECT * FROM users"
            db.all(sql, [] ,(err: Error | null, list: User[]) => {
                if (err) {
                    reject(err)
                    return;
                }
                let userList: User[] = [];
                list.forEach((itm) => {
                    let user = new User(itm.username,itm.name,itm.surname,itm.role,itm.address,itm.birthdate);
                    userList.push(user)
                })
                resolve(userList)
            })
        })

    }

    getUsersByRole(role: String):Promise<User[]> {
        return new Promise<User[]>((resolve,reject) => {
            const sql = "SELECT * FROM users WHERE role = ?"
            db.all(sql,[role],(err: Error | null, res:User[]) => {
                if (err) {
                    reject(err)
                    return;
                }
                let userByRoleList: User[] = []
                res.forEach((itm) => {
                    let user:User = new User(itm.username,itm.name,itm.surname,itm.role,itm.address,itm.birthdate)
                    userByRoleList.push(user)
                })
                resolve(userByRoleList)
            })
        })
    }

    deleteUser(username: string) {
        return new Promise<boolean>((resolve,reject) => {
            const sql = "DELETE FROM users WHERE username = ?"
            db.run(sql,[username],(err:Error|null,row:any) => {
                if (err) {
                    reject(err)
                }
                resolve(true)
            })
        })
    }

    deleteAll(): Promise<boolean> {
        return new Promise((resolve,reject) => {
                const sql = "DELETE FROM users WHERE role <> ?"
                db.run(sql,[Role.ADMIN],(err:Error|null,row:any) => {
                    if (err) {
                        reject(err)
                    }
                    resolve(true)
                })

        })

    }

    userExist(username: string):Promise<boolean> {
        return new Promise((resolve,reject) => {
            const sql = "SELECT * FROM users WHERE username = ?";
            db.get(sql,[username],(err:Error|null, row:any) => {
                if (err) reject(err);
                row ? resolve(true) : resolve(false)
            });
        })
    }

    updateUserInfo(name: string, surname: string, address: string, birthdate: string, username: string):Promise<void>{
        return new Promise((resolve,reject) => {
            const sql = "UPDATE users SET name=?, surname=?, address=?, birthdate=? WHERE username=?"
            db.run(sql,[name,surname,address,birthdate,username],(err:Error|null,row:any) => {
                if (err) reject(err);
                resolve()
            })
        })
    }
}
export default UserDAO