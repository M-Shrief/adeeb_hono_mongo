import { TimeUnit } from "@valkey/valkey-glide"
// 
import { cache } from './index.js'
import { logger } from "../utils/logger.js"

export const cache_get = async(key: string): Promise<{} | null> => {
    try {
        let cache_str = await cache.get(key)
        if (!cache_str) {
            return null
        }
        let obj = await JSON.parse(String(cache_str))
        return obj
    } catch(e) {
        logger.error({error: e}, `Cache get error for ${key} key`)
        return null
    }
}

export const cache_set = async(key: string, value: any, minutes: number =  15) => {
    try {
        await cache.set(
            key, 
            JSON.stringify(value), 
            {
                expiry: {type: TimeUnit.Seconds, count: 60 * minutes}
            }
        )
    } catch(e) {
        logger.error({error: e}, `Cache set error for ${key} key`)
    }
}


export const cache_del = async(key: string) => {
    try {
        await cache.del([key])
    } catch(e) {
        logger.error({error: e}, `Cache del error for ${key} key`)
    }
}

export const format_key_by_id = (prefix: string, id: string) => prefix + ":" + id 