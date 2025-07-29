import { IBaseModel } from './base'
import BaseActiveModel, { IBaseActiveModel } from './base-active'

export interface IReminder extends IBaseActiveModel {
  title: string,
  dateTime: string
  isNotified: boolean
  statusId: number
  categoryId: number
}

export default class ReminderModel extends BaseActiveModel implements IBaseModel {
  title = ''
  dateTime = ''
  isTimeSet = ''
  photoPath = ''
  isNotified = false
  isHidden = false
  statusId = 0
  categoryId = 0

  static tableName = 'reminders'
  static writeFields = [
    'title',
    'dateTime',
    'isNotified',
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
    title: 'required|string|max:65655',
    isNotified: 'boolean',
    dateTime: 'required|date',
  }

  constructor (data: IReminder) {
    super(data)

    this.assignFields(data)
  }
}
