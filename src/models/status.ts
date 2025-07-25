import BaseModel, { IBaseModel } from './base'

export interface IStatus extends IBaseModel {
  title: string,
  name: string,
}

export default class StatusModel extends BaseModel {
  title = ''
  name = ''

  static tableName = 'statuses'
  static writeFields = ['name', 'title']
  static readFields = [
    ...this.writeFields,
  ]

  static STATUS_ACTIVE = 'active'
  static STATUS_INACTIVE = 'inactive'

  constructor (data: IStatus) {
    super(data)
    this.assignFields(data)
  }
}
