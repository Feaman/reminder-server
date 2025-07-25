import BaseModel, { IBaseModel } from './base'
import UserModel from './user'

export interface IBaseActiveModel extends IBaseModel {
  statusId: number 
  userId?: number
  user?: UserModel
}

export default class BaseActiveModel extends BaseModel {
  statusId: number 
  userId?: number
  user?: UserModel

  constructor (data: IBaseActiveModel) {
    super(data)
    this.statusId = data.statusId
    this.userId = data.userId
  }
}
