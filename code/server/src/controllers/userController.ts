import { UserIsAdminError, UserNotFoundError } from "../errors/userError"
import { Role, User } from "../components/user"
import UserDAO from "../dao/userDAO"
import { resolve } from "path"
import { rejects } from "assert"
import { UnauthorizedUserError } from "../errors/userError"
import dayjs from "dayjs"
import { DateError } from "../utilities"



/**
 * Represents a controller for managing users.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class UserController {
    private dao: UserDAO



    constructor() {
        this.dao = new UserDAO
    }

    /**
     * Creates a new user.
     * @param username - The username of the new user. It must not be null and it must not be already taken.
     * @param name - The name of the new user. It must not be null.
     * @param surname - The surname of the new user. It must not be null.
     * @param password - The password of the new user. It must not be null.
     * @param role - The role of the new user. It must not be null and it can only be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    async createUser(username: string, name: string, surname: string, password: string, role: string): Promise<Boolean> {
        return this.dao.createUser(username, name, surname, password, role)
    }

    /**
     * Returns all users.
     * @returns A Promise that resolves to an array of users.
     */
    async getUsers() :Promise<User[]> {

        try {
            let userList = await this.dao.getUsers();
            return userList;
        } catch (err) {
            throw err;
         }
     }

    /**
     * Returns all users with a specific role.
     * @param role - The role of the users to retrieve. It can only be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to an array of users with the specified role.
     */
    async getUsersByRole(role: string) :Promise<User[]> {

        try {
            let userByRoleList = await this.dao.getUsersByRole(role);
            return userByRoleList;
        } catch (err) {
            throw err;
        }
     }

    /**
     * Returns a specific user.
     * The function has different behavior depending on the role of the user calling it:
     * - Admins can retrieve any user
     * - Other roles can only retrieve their own information
     * @param username - The username of the user to retrieve. The user must exist.
     * @returns A Promise that resolves to the user with the specified username.
     */
    async getUserByUsername(user: User, username: string) :Promise<User> {
      try {
        if (user.role != Role.ADMIN) {
            if (user.username == username) {
                return this.dao.getUserByUsername(username)
            } else {
                throw new UnauthorizedUserError()
            }
        } else {
            return this.dao.getUserByUsername(username);
        }
      } catch (err) {
            throw err;
      }
     }

    /**
     * Deletes a specific user
     * The function has different behavior depending on the role of the user calling it:
     * - Admins can delete any non-Admin user
     * - Other roles can only delete their own account
     * @param username - The username of the user to delete. The user must exist.
     * @returns A Promise that resolves to true if the user has been deleted.
     */
    async deleteUser(user: User, username: string):Promise<boolean> {

       try {
        if(user.role == Role.ADMIN) {
            let usertToDelete = await this.dao.getUserByUsername(username);
            if (usertToDelete.role == Role.ADMIN && user.username != usertToDelete.username ) {
                throw new UserIsAdminError
            }
        }

        if (user.role != Role.ADMIN) {
            if (user.username == username) {
                return this.dao.deleteUser(username)
            } else {
                //FIXME: Lancia eccezione per cui utente non admin non può cancellare utenti diversi da se stesso
                throw new UnauthorizedUserError
            }
        } else {
            return this.dao.deleteUser(username)
        }
       } catch (err) {
        throw err;
       }
     }

    /**
     * Deletes all non-Admin users
     * @returns A Promise that resolves to true if all non-Admin users have been deleted.
     */
    async deleteAll(): Promise<boolean> {
        return this.dao.deleteAll();
     }

    /**
     * Updates the personal information of one user. The user can only update their own information.
     * @param user The user who wants to update their information
     * @param name The new name of the user
     * @param surname The new surname of the user
     * @param address The new address of the user
     * @param birthdate The new birthdate of the user
     * @param username The username of the user to update. It must be equal to the username of the user parameter.
     * @returns A Promise that resolves to the updated user
     */
    async updateUserInfo(user: User, name: string, surname: string, address: string, birthdate: string, username: string):Promise<User> {
        try{

            const userExist:boolean = await this.dao.userExist(username);
            if(!userExist) throw new UserNotFoundError;

            if (dayjs().isBefore(dayjs(birthdate))) {
                throw new DateError;
            }

            const userToUpdate: User = await this.dao.getUserByUsername(username)

            //NOTA: Tutto questo blocco verifica la condizione per cui, solo se l'utente è admin, può modificare anche gli username degli altri!
            if (user.role != Role.ADMIN) {
                if (user.username == username) {
                    this.dao.updateUserInfo(name,surname,address,birthdate,username);
                    return this.dao.getUserByUsername(username)
                } else {
                    throw new UnauthorizedUserError
                }
            } else if (userToUpdate.role != Role.ADMIN) {
                this.dao.updateUserInfo(name,surname,address,birthdate,username);
                return this.dao.getUserByUsername(username)
            } else {
                throw new UserIsAdminError
            }

        } catch (err) {
            throw err;
        }

     }
}

export default UserController