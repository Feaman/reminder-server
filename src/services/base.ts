import { MysqlError, OkPacket, Pool } from 'mysql'
import BaseModel, { IBaseModel } from '~/models/base'
import BaseActiveModel, { IBaseActiveModel } from '~/models/base-active'
import ReminderModel from '~/models/reminder'
import StatusModel from '~/models/status'
import UserModel from '~/models/user'
import { mySqlUser, mySqlUserPassword } from '../secrets'

type TDataObject = { [key: string]: string | number | (() => boolean) | (() => string[]) | ((data: IBaseModel) => void) }
type TWhereObject = { [key: string]: string | number }

const models: { [key: string]: typeof BaseModel} = {
  Reminder: ReminderModel,
  Status: StatusModel,
  User: UserModel,
}

export default class BaseService {
  static pool: Pool
  static tableName: string

  static init (): void {
    const mysql = require('mysql')
    this.pool = mysql.createPool({
      socketPath: '/var/lib/mysql/mysql.sock',
      user: mySqlUser,
      password: mySqlUserPassword,
      database: 'reminder',
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci'
    })
  }

  static async getList (modelName: string, status?: StatusModel, user?: UserModel, whereObject?: TWhereObject): Promise<BaseModel[]> {
    const Model = models[modelName]
    let where = ''
    const values: TWhereObject = {}

    if (user) {
      values.userId = String(user.id)
    }
    
    if (status) {
      values.statusId = String(status.id)
    }

    if (whereObject) {
      Object.assign(values, whereObject)
    }

    if (Object.keys(values).length) {
      where = 'where ' + Object.keys(values).map(key => `${key} = ?`).join(' and ')
    }

    const sql =
    `select id, ${Model.readFields.join(',')} ` +
      `from ${Model.tableName} ` + 
      where +
      ' order by id desc'

    // const mysql = require('mysql')
    // const sqlFormatted = mysql.format(sql, Object.values(values))
    // console.log(sqlFormatted)

    return new Promise((resolve, reject) => {
      const entities: BaseModel[] = []

      this.pool.query(
        {
          sql,
          values: Object.values(values),
        },
        (error: Error, data: IBaseModel[]) => {
          if (error as Error) {
            console.error(error)
            return reject({ message: 'Sorry, SQL error :-c' })
          }

          data.forEach(async (entityData) => {
            entities.push(new Model(entityData))
          })

          resolve(entities)
        })
    })
  }

  static getWritableDataFromModel (model: BaseModel): TDataObject {
    const data: TDataObject = {};

    (model.constructor as typeof BaseActiveModel).writeFields.forEach((fieldName: string) => {
      data[fieldName] = model[fieldName as keyof BaseModel]
    })

    return data
  }

  static save (model: BaseActiveModel): Promise<BaseActiveModel> {
    return new Promise((resolve, reject) => {
      // Validation
      const errors = model.validate()
      if (errors.length) {
        return reject(new Error(errors.join('')))
      }

      const data = this.getWritableDataFromModel(model)
      if (!model.id) {
        BaseService.pool.query(
          `insert into ${(model.constructor as typeof BaseActiveModel).tableName} set ?`,
          data,
          (error: MysqlError | null, result: OkPacket) => {
            if (error) {
              console.error(error)
              return reject({ message: 'Sorry, SQL error :-c' })
            }

            model.id = result.insertId
            resolve(model)
          }
        )
      } else {
        BaseService.pool.query(
          `update ${(model.constructor as typeof BaseActiveModel).tableName} set ? where id = ?`,
          [data, model.id],
          (error: MysqlError | null) => {
            if (error) {
              console.error(error)
              return reject({ message: 'Sorry, SQL error :-c' })
            }
            resolve(model)
          }
        )
      }
    })
  }

  static async create (modelName: string, data: IBaseActiveModel, user?: UserModel): Promise<BaseActiveModel> {
    const Model = models[modelName]
    const entity = new Model(data) as BaseActiveModel
    entity.id = 0
    const activeStatus = await this.getActiveStatus()
    if (!activeStatus) {
      throw new Error('Active status not found')
    }
    entity.statusId = activeStatus.id

    if (user) {
      entity.userId = user.id
    }

    await this.save(entity)

    // Get fresh data
    const entityData = await BaseService.findByField(modelName, 'id', entity.id, activeStatus, user) as BaseActiveModel
    if (!entityData) {
      throw new Error('Record not found')
    }

    return entityData
  }

  static async update (
    modelName: string,
    entityId: string,
    data: IBaseModel | IBaseActiveModel,
    user?: UserModel,
    isDeletePhoto?: boolean,
  ): Promise<BaseActiveModel> {
    const activeStatus = await this.getActiveStatus()
    if (!activeStatus) {
      throw new Error('Active status not found')
    }
    const entity = await this.findByField(modelName, 'id', entityId, activeStatus, user) as BaseActiveModel

    if (!entity) {
      throw new Error(`${modelName} with id '${entityId}' not found`)
    }

    if (user) {
      entity.userId = user.id
    }

    if (isDeletePhoto) {
      entity.unlinkFiles()
    }

    Object.assign(entity, data)

    await this.save(entity)

    // Get fresh data
    const entityData = await BaseService.findByField(modelName, 'id', entityId, activeStatus, user) as BaseActiveModel
    if (!entityData) {
      throw new Error(`Updated ${modelName} with id '${entityId}' not found`)
    }

    return entityData
  }

  static async remove (
    modelName: string,
    entityId: string,
    user?: UserModel,
    isDeletePhoto = false,
  ): Promise<void> {
    const activeStatus = await this.getActiveStatus()
    if (!activeStatus) {
      throw new Error('Active status not found')
    }

    const inactiveStatus = await this.getInactiveStatus()
    if (!inactiveStatus) {
      throw new Error('Inactive status not found')
    }

    const entity = await this.findByField(modelName, 'id', entityId, activeStatus, user) as BaseActiveModel
    if (!entity) {
      throw new Error(`${modelName} with id '${entityId}' not found`)
    }

    entity.statusId = inactiveStatus.id
    entity.deleted = new Date().toISOString()

    await this.save(entity)

    if (isDeletePhoto) {
      entity.unlinkFiles()
    }
  }

  static async restoreById (modelName: string, entityId: number, user: UserModel): Promise<BaseActiveModel> {
    const inactiveStatus = await this.getInactiveStatus()
    if (!inactiveStatus) {
      throw new Error('Inactive status not found')
    }

    const entity = await this.findByField(modelName, 'id', entityId, inactiveStatus, user) as BaseActiveModel

    const activeStatus = await this.getActiveStatus()
    if (!activeStatus) {
      throw new Error('Active status not found')
    }

    entity.statusId = activeStatus.id

    return this.save(entity)
  }

  static async findByField (
    modelName: string,
    fieldName: string,
    fieldValue: string | number,
    status?: StatusModel,
    user?: UserModel,
  ): Promise<BaseModel | BaseActiveModel | undefined> {
    const Model = models[modelName]
    const values = [fieldValue]

    if (user) {
      values.push(user.id)
    }

    if (status) {
      values.push(status.id)
    }

    return new Promise((resolve, reject) => {
      this.pool.query({
        sql: `select id, ${Model.readFields.join(',')} from ${Model.tableName} where ${fieldName} = ?${user ? ' and userId = ?' : ''}${status ? ' and statusId = ?' : ''}`,
        values,
      },
      (error: MysqlError, data: IBaseModel[]) => {
        if (error) {
          console.error(error)
          return reject({ message: 'Sorry, SQL error :-c' })
        }

        if (!data.length) {
          return resolve(undefined)
        }

        resolve(new Model(data[0]))
      })
    })
  }

  static getActiveStatus (): Promise<StatusModel | undefined> {
    return this.findByField('Status', 'name', StatusModel.STATUS_ACTIVE) as unknown as Promise<StatusModel>
  }

  static getInactiveStatus (): Promise<StatusModel |  undefined> {
    return this.findByField('Status', 'name', StatusModel.STATUS_INACTIVE) as unknown as Promise<StatusModel>
  }
}
