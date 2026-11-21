import { Types } from "mongoose";
import {randomUUID} from "node:crypto"
import { FlushMode } from '@valkey/valkey-glide';
// /////
import { logger } from '../../../utils/logger.js';
import { JWTModel, TokenType, TokenTypeEnum } from "../../../database/schemas.js";
import { cache_del, cache_get, cache_set, format_key_by_id } from "../../../cache/utils.js"
import { cache } from "../../../cache/index.js"
import { Claims } from "../../../schemas/jwt.js";
import * as time_utils from "../../../utils/time.js"
import {ACCESS_EXP_MIN_DELTA, REFRESH_EXP_MIN_DELTA} from "../../../auth/jwt.js"
import { APIError } from '../../../utils/errors.js'
import { HttpStatusCode } from '../../../utils/api.js';
import { JWTType } from './schemas.js';

const cache_prefix = "jwts" 

/**
 * return new JWT claims for access & refresh token respectively
 */
const new_tokens = async(user: Claims["user"], family_id?: string) => {
    try {
        if (!family_id) {
            family_id = randomUUID()
        }
        let access_model = {
            jti: "",
            user: user?.id,
            family_id: family_id,
            is_banned: false,
            token_type: TokenTypeEnum.ACCESS as TokenType, 
            exp: time_utils.NowWithDelta(ACCESS_EXP_MIN_DELTA),
            iat: time_utils.Now()
        }
        let refresh_model = {
            jti: "",
            user: user?.id,
            family_id: family_id,
            is_banned: false,
            token_type: TokenTypeEnum.REFRESH as TokenType,
            exp: time_utils.NowWithDelta(REFRESH_EXP_MIN_DELTA),
            iat: time_utils.Now()
        }

        await JWTModel.insertMany([
                {
                    user: access_model.user!,
                    family_id: access_model.family_id,
                    is_banned: access_model.is_banned,
                    token_type: access_model.token_type,
                    exp: access_model.exp,
                    iat: access_model.iat,
                },
                {
                    user: refresh_model.user!,
                    family_id: refresh_model.family_id,
                    is_banned: refresh_model.is_banned,
                    token_type: refresh_model.token_type,
                    exp: refresh_model.exp,
                    iat: refresh_model.iat,
                }

        ]).then(res => {
                for (let token of res) {
                    if(token.token_type == TokenTypeEnum.ACCESS) {
                        access_model.jti = token._id.toString()
                    } else {
                        refresh_model.jti = token._id.toString()
                    }
                }
        }).catch(e=> {
            let msg: string
            if (e.name === "ValidationError") {
                throw new APIError(HttpStatusCode.UNPROCESSABLE_ENTITY, "repository", e.message)
            } else {
                throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            }
        })
        
        await cache_set(format_key_by_id(cache_prefix, access_model.jti.toString()), access_model, 15)

        return {access_model, refresh_model}
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in JWT's new_tokens()")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
        }
    }
} 

const get_all = async (limit: number, offset: number) => {
    try {
        const result = await JWTModel.aggregate([
            {
                $unset: ['__v'],
            },
            {
                $facet: {
                    data: [ { $skip: offset }, { $limit: limit } ], // Get documents
                    count: [ { $count: 'total_count' } ]          // Get count
                }
            }
        ]);

        const jwts = result[0].data;
        const total_count = result[0].count[0] ? result[0].count[0].total_count : 0; 

        return {
            data: jwts,
            limit, 
            offset, 
            total_count: total_count
        }
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in GET /jwts")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const get_one_by_id = async (id: string) => {
    try {
        let cache_key = format_key_by_id(cache_prefix, id)
        let cache_res = await cache_get(cache_key)

        if(cache_res) {
            return cache_res as JWTType
        }

        let result = await JWTModel.findById(id, {
            family_id: 1,
            token_type: 1,
            used: 1,
            is_banned: 1,
            exp: 1,
            iat: 1,
            //
            user: 1
        })
        .populate("user", ["_id", "username", "roles"])
        if (!result) {
            throw new APIError(HttpStatusCode.NOT_FOUND, "repository")
        }
        return {
            jti: result._id.toString(),
            family_id: result.family_id.toString(),
            token_type: result.token_type,
            exp: result.exp,
            iat: result.iat,
            used: result.used,
            is_banned: result.is_banned,
            user: {
                id: (result.user as any).id,
                username: (result.user as any).username,
                roles: (result.user as any).roles,
            }
        } as JWTType
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /jwts/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
        }
    }  
}

const update_one = async(id: string, data: any) => {
    try {        
        await JWTModel.updateOne( { _id: new Types.UUID(id) }, { $set: { ...data} })

        // Delete from cache after update to prevent showing old data
        let cache_key = format_key_by_id(cache_prefix, id)
        await cache_del(cache_key)
        return null
    } catch(e: any) {
        if (e.name === "ValidationError") {
            throw new APIError(HttpStatusCode.UNPROCESSABLE_ENTITY, "repository", e.message)
        }
        logger.error({error: e}, "Error in PUT /jwts/:id")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}    


const ban_jwts_with_filters = async(user_id?: string, family_id?: string) => {
    try {        
        let tokens = [] 
        if(user_id) {
            tokens = await JWTModel.find({ user: new Types.UUID(user_id) }, { _id: 1, user: 1 });
            await JWTModel.updateMany({ user: new Types.UUID(user_id)}, { $set: { is_banned: true} })
        } else if(family_id) {
            tokens = await JWTModel.find({ family_id: new Types.UUID(family_id) }, { _id: 1, user: 1 });
            await JWTModel.updateMany({ family_id: new Types.UUID(family_id)}, { $set: { is_banned: true} })
        } else {
            throw new APIError(HttpStatusCode.BAD_REQUEST, "repository", "Filter wasn't provided")
        }

        let cache_keys: string[] = []
        for(let token of tokens) {
            // Delete from cache after update to prevent showing old data
            let cache_key = format_key_by_id(cache_prefix, token._id.toString())
            cache_keys.push(cache_key)
        }
        await cache.del(cache_keys)    

        return null
    } catch(e: any) {
        if (e.name === "ValidationError") {
            throw new APIError(HttpStatusCode.UNPROCESSABLE_ENTITY, "repository", e.message)
        }
        logger.error({error: e}, "Error in banning JWTs with filters")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}    

const delete_one = async(id: string) => {
    try {       
    
        await JWTModel.deleteOne({ _id: new Types.UUID(id) })

        // Delete from cache after delete to prevent showing old data
        let cache_key = format_key_by_id(cache_prefix, id)
        await cache_del(cache_key)

        return null
    } catch(e: any) {
        logger.error({error: e}, "Error Delete /poems/:id")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}    

const delete_user_jwts = async(user_id: string) => {
    try {       
        let tokens = [] 
        
        tokens = await JWTModel.find({ user: new Types.UUID(user_id) }, { _id: 1, user: 1 });
        await JWTModel.deleteMany({ user: new Types.UUID(user_id)})

        let cache_keys: string[] = []
        for(let token of tokens) {
            // Delete from cache after update to prevent showing old data
            let cache_key = format_key_by_id(cache_prefix, token._id.toString())
            cache_keys.push(cache_key)
        }
        await cache.del(cache_keys)    

        return null
    } catch(e: any) {
        logger.error({error: e}, "Error in banning user tokens")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}    

const cleanup = async() => {
    try{    
        await JWTModel.deleteMany({
            token_type: {$eq: "access"},
            exp: { $lt: time_utils.NowWithDelta(60 * 24 * -1) }
        });
        await JWTModel.deleteMany({
            token_type: {$eq: "refresh"},
            exp: { $lt: time_utils.NowWithDelta(REFRESH_EXP_MIN_DELTA * -1) }
        });
        await cache.flushall(FlushMode.ASYNC)
    } catch(e: any) {
        logger.error({error: e}, "Error in jwt cleanup")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}



export const repository = {
    new_tokens,
    get_all,
    get_one_by_id,
    ban_jwts_with_filters,
    update_one,
    delete_one,
    delete_user_jwts,
    cleanup,
}
