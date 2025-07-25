import { Request } from "express"
import jwt from 'jsonwebtoken'
import UserModel from "~/models/user"
import BaseService from "./base"
const fs = require('fs')

const publicKey = fs.readFileSync('public.pem', 'utf8')

export default class RequestService {
  static async getUserFromRequest (request: Request): Promise<UserModel | null> {
    if (request.headers.authorization){
      const payload = <{ [key: string]: any }>( jwt.verify(
        request.headers.authorization.split(' ')[1],
        publicKey,
        { 
          algorithms: ['RS256'] 
        }
      ))
      return await BaseService.findByField('User', 'id', payload.id) as UserModel
    }

    return null
  }
}
