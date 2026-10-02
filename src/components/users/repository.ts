import { QueryFilter, Types } from 'mongoose';
/////
import { RoleEnum, UserModel } from "../../database/schemas.js"
import { logger } from '../../utils/logger.js';
import { User } from './types.js';
import { APIError } from '../..//utils/errors.js'
import { HttpStatusCode } from '../../utils/api.js';
import { hash_password, RoleEnumType } from '../../utils/auth.js';


const get_all = async (limit: number, offset: number) => {
    try {
        const result = await UserModel.aggregate([
            {
                $unset: ['password', 'reviewed', 'created_at', 'updated_at', '__v'],
            },
            {
                $facet: {
                    data: [ { $skip: offset }, { $limit: limit } ], // Get documents
                    count: [ { $count: 'total_count' } ]          // Get count
                }
            }
        ]);

        const users = result[0].data;
        const total_count = result[0].count[0] ? result[0].count[0].total_count : 0; 

        return {
            data: users,
            limit, 
            offset, 
            total_count: total_count
        }
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in GET /users")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const get_one_by_id = async (id: string)  => {
    try {

        let user = await UserModel.findById(id, {
            _id: 1,
            username: 1,
            roles: 1,
        });
        if (!user) {
            throw new APIError(HttpStatusCode.NOT_FOUND, "repository")
        }
        return user
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /users/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
        }
    }
}

const signup = async(data: any) => {
    try {
        let hashed_pass = await hash_password(data.password)

        // Ensuring integrity, by removing duplicates and having Normal role as a must.
        let roles = new Set<RoleEnumType>(data.roles as RoleEnumType[])
        roles.add(RoleEnum.NORMAL)

        let new_user = await UserModel.create({username: data.username, password: hashed_pass, roles: [...roles] as any} )
        return new_user
    } catch(e: any) {
        if (e.code === 11000) { // Handle Duplicate Key Error
            throw new APIError(HttpStatusCode.CONFLICT, "repository", "Poem already exists")
        }
        if (e.name === "ValidationError") {
            throw new APIError(HttpStatusCode.UNPROCESSABLE_ENTITY, "repository", e.message)
        }
        if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in POST /users/signup")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}


const get_one_for_login = async(username: string) => {
    try {
        let filter_q: QueryFilter<typeof UserModel> = { username:  username}
        let existing_user = await UserModel.findOne(filter_q, {
            _id: 1,
            username: 1,
            password: 1,
            roles: 1,
        })
        if (!existing_user) {
            throw new APIError(HttpStatusCode.NOT_FOUND, "repository")
        }

        return existing_user
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in querying user by username for login request")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const update_current_user = async(id: string, data: any) => {
    try {        
        let hashed_pass = undefined
        if (data.password) {
            hashed_pass = await hash_password(data.password)
        }

        let filter_q: QueryFilter<typeof UserModel> = { _id: new Types.UUID(id) }
        await UserModel.updateOne( filter_q, { $set: {username: data.username, password: hashed_pass }})
        return null
    } catch(e: any) {
        logger.error({error: e}, "Error in PUT /users/me")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}    

const update_user_by_id = async(id: string, data: any) => {
    try {        
        let hashed_pass = undefined
        if (data.password) {
            hashed_pass = await hash_password(data.password)
        }
        let roles = undefined
        if(data.roles) {
            // Ensuring integrity, by removing duplocates and having Normal role as a must.
            roles = new Set<RoleEnumType>(data.roles as RoleEnumType[])
            roles.add(RoleEnum.NORMAL)
            roles = [...roles]
        }

        let filter_q: QueryFilter<typeof UserModel> = { _id: new Types.UUID(id) }
        await UserModel.updateOne( filter_q, { $set: {username: data.username, password: hashed_pass, roles: roles }})

        return null
    } catch(e: any) {
        logger.error({error: e}, "Error in PUT /users/:id")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const ban_user_by_id = async(id: string) => {
    try {        
        let filter_q: QueryFilter<typeof UserModel> = { _id: new Types.UUID(id) }
        // Use the $addToSet operator instead of $push to prevent duplicates from being added to the array. 
        await UserModel.updateOne( filter_q, { $addToSet: { roles: RoleEnum.BANNED }} )
        return null
    } catch(e: any) {
        logger.error({error: e}, "Error in PUT /users/:id/ban")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}


const delete_one = async(id: string) => {
    try {        
        let filter_q: QueryFilter<typeof UserModel> = { _id: new Types.UUID(id) }
        await UserModel.deleteOne( filter_q)
        return null
    } catch(e: any) {
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}    


export const repository = {
    get_all,
    get_one_by_id,
    signup,
    get_one_for_login,
    update_current_user,
    update_user_by_id,
    ban_user_by_id,
    delete_one,
}
