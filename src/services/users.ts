import UserModel, { IUser } from '~/models/user'
import BaseService from '~/services/base'

export default class UsersService extends BaseService {
  static async login (userData: IUser): Promise<UserModel> {
    const user = await this.findByField('User', 'email', userData.email) as UserModel
    if (!user) {
      throw new Error('Неверная электропочта или паролька')
    }

    if (!UserModel.comparePassword(userData.password, user.passwordHash)) {
      throw new Error('Неверная электропочта или паролька')
    }
    user.passwordHash = ''

    return user
  }
}
