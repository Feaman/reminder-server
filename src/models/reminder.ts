import { IBaseModel } from './base'
import BaseActiveModel, { IBaseActiveModel } from './base-active'

export interface IReminder extends IBaseActiveModel {
  text: string,
  dateTime: string
  isTimeSet: string
  photoPath: string
  isHidden: boolean
  statusId: number
  categoryId: number
}

export default class ReminderModel extends BaseActiveModel implements IBaseModel {
  text = ''
  dateTime = ''
  isTimeSet = ''
  photoPath = ''
  isHidden = false
  statusId = 0
  categoryId = 0

  static tableName = 'reminders'
  static writeFields = [
    'title',
    'dateTime',
    'userId',
    'statusId',
  ]
  static readFields = [
    ...this.writeFields,
    'updated',
    'created',
    'deleted',
  ]
  static unlinkFields = ['photoPath']

  static rules = {
    id: 'numeric',
    text: 'required|string|max:65655',
    dateTime: 'required|string|max:55',
  }

  constructor (data: IReminder) {
    super(data)

    this.assignFields(data)
    this.dateTime = (typeof data.dateTime === 'string' ? data.dateTime : (data.dateTime as Date).toISOString())
  }
}
