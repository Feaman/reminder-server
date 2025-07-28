import BaseModel, { IBaseModel } from "./base"

export interface ICounter extends IBaseModel {
  title: string,
  name: string,
  dateTime: string
  isSystem: number
  statusId: number
}

export default class CounterModel extends BaseModel {
  title = ''
  name = ''
  dateTime = ''
  isSystem = 0
  statusId = 0

  static tableName = 'counters'
  static writeFields = [
    'name',
    'title',
    'dateTime',
    'isSystem',
    'userId',
    'statusId',
  ]
  static readFields = [
    ...this.writeFields,
    'updated',
    'created',
    'deleted',
  ]
  static rules = {
    id: 'numeric',
    name: 'required|string|max:255',
    title: 'required|string|max:255',
    isSystem: 'boolean',
    dateTime: 'string|max:155',
  }

  constructor (data: ICounter) {
    super(data)
    this.assignFields(data)

    if (this.id && !this.isSystem) {
      this.name = data.name.replace(`${data.userId}-`, '')
    }
    this.dateTime = (typeof data.dateTime === 'string' ? data.dateTime : (data.dateTime as Date).toISOString())
  }
}
