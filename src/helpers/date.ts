export default class Helper {
  static getDateNumber(date: Date): number {
    return date.getFullYear() + date.getMonth() + date.getDate()
  }

  static formatRussianDateTime(date: Date): string {
    return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short' }).format(date)
  }
}