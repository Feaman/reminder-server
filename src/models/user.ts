import BaseActiveModel, { IBaseActiveModel } from './base-active'

export interface IUser extends IBaseActiveModel {
  id: number,
  firstName: string,
  secondName: string,
  email: string,
  pushTokens: string,
  passwordHash: string,
  password: string,
}

export default class UserModel extends BaseActiveModel {
  firstName = ''
  secondName = ''
  email = ''
  passwordHash = ''
  pushTokens = ''
  
  static tableName = 'users'
  static writeFields = [
    'firstName',
    'secondName',
    'email',
    'passwordHash',
    'pushTokens'
  ]
  static readFields = [
    ...this.writeFields,
    'created',
    'updated',
  ]

  static rules = {
    id: 'numeric',
    firstName: 'required|string|max:255',
    secondName: 'required|string|max:255',
    email: 'required|email|max:100',
    pushTokens: 'string|max:65565',
    password: 'string|max:155',
    passwordHash: 'string',
  }

  static hashPassword (password: string): string {
    try {
      return require('crypto')
        .createHash('sha256')
        .update(password)
        .digest('hex')
    } catch (err) {
      throw new Error('Password hashing error')
    }
  }

  static comparePassword (password: string, passwordHash: string): boolean {
    try {
      const requestPasswordHash = this.hashPassword(password)
      return requestPasswordHash === passwordHash
    } catch (err) {
      throw new Error('Password compare error')
    }
  }

  constructor (data: IUser) {
    super(data)

    this.assignFields(data)
    if (data.password) {
      this.passwordHash = UserModel.hashPassword(data.password)
    }
  }
}
