import Validator from 'validatorjs'

export interface IBaseModel {
  [key: string]: any,
  id: number,
  created: string,
  updated: string,
  deleted: string,
}

export default class BaseModel implements IBaseModel {
  id: number 
  created: string
  updated: string
  deleted: string

  static tableName = ''
  static unlinkFields: string[] = []
  static readFields: string[] = []
  static writeFields: string[] = []
  static rules = {}

  constructor (data: IBaseModel) {
    this.id = data.id
    this.created = data.created
    this.updated = data.updated
    this.deleted = data.deleted
  }

  assignFields (data: IBaseModel): void {
    (this.constructor as typeof BaseModel).readFields.forEach(fieldName => {
      this[fieldName as keyof BaseModel] = data[fieldName] as never
    })
  }

  validate (): string[] {
    const validation = new Validator(this, (this.constructor as typeof BaseModel).rules)
    let errors: string[] = []
    if (!validation.passes()) {
      (this.constructor as typeof BaseModel).readFields.forEach(field => {
        errors = errors.concat(validation.errors.get(field))
      })
    }

    return errors
  }

  unlinkFiles (): void {
    try {
      const FileSystem = require('fs');

      (this.constructor as typeof BaseModel).unlinkFields.forEach(field => {
        const model = (this as { [key: string]: any })
        if (model[field]) {
          FileSystem.unlinkSync(__dirname + '/' + model[field])
        }
      })
    } catch (error) {
      console.error(error)
    }
  }
}
