import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import http from 'http'
import jwt from 'jsonwebtoken'
import BaseModel from './models/base'
import ReminderModel from './models/reminder'
import StatusModel from './models/status'
import UserModel from './models/user'
import BaseService from './services/base'
import RequestService from './services/request'
import UsersService from './services/users'

const crypto = require('crypto')
const multer  = require('multer')
const PORT = 3022
const storage = new WeakMap()
const fs = require('fs')
const privateKey = fs.readFileSync('private.pem', 'utf8')
const app = express()
const filesPath = 'files'

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use('/files', express.static(filesPath))
app.use(cors())

const server = http.createServer(app)
server.listen(PORT, async function () {
  console.log(`REMINDER server started on port ${PORT}`)
})

// Firebase initialization
const admin = require('firebase-admin')
const serviceAccount = require('./elven-reminder-firebase-adminsdk.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const filesStorage = multer.diskStorage({
  destination: function (request: Request, _file: File, callback: (error: null, path: string) => void) {
    const currentUser = storage.get(request)
    const folder = `${filesPath}/${currentUser.id}/`

    if (!fs.existsSync(folder)){
      fs.mkdirSync(folder, { recursive: true })
    }

    callback(null, folder)
  },
  filename: function (_request: Request, file: { originalname: string, fieldname: string }, callback: (error: null, path: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    callback(null, `${file.fieldname}--${uniqueSuffix}__${file.originalname}`)
  }
})
const upload = multer({ storage: filesStorage })

BaseService.init()

const statuses = await BaseService.getList('Status') as StatusModel[]
const activeStatus = statuses.find(status => status.name === StatusModel.STATUS_ACTIVE)

function checkAccess(request: Request, response: Response, next: NextFunction) {
  if (storage.get(request)) {
    return next()
  }

  return response.status(401).send({ message: 'Not Authorized' })
}


async function getData(currentUser: UserModel, isEmpty = false, isAuth = false): Promise<any> {
  let reminders: BaseModel[] = []
  if (!isEmpty) {
    const data = await Promise.all([
      BaseService.getList('Reminder', activeStatus, currentUser),
    ])
    reminders = data[0]
  }

  const userData = {
    id: currentUser.id,
    firstName: currentUser.firstName,
    secondName: currentUser.secondName,
    email: currentUser.email,
    created: currentUser.created,
    updated: currentUser.updated,
  }

  const result: { [key: string]: BaseModel[] | typeof userData | string } = {
    statuses,
    reminders,
    user: userData,
  }

  if (isAuth) {
    result.token = jwt.sign(
      { id: currentUser.id },
      privateKey,
      {
        algorithm: 'RS256', // Используем RSA с SHA-256
        // expiresIn: '1m' // Время жизни токена
      }
    )
  }

  return result
}

app.use(async (request: Request, _response: Response, next: NextFunction) => {
  try {
    const user = await RequestService.getUserFromRequest(request)

    if (!user) return next()

    storage.set(
      request,
      {
        id: user.id,
        firstName: user.firstName,
        secondName: user.secondName,
        email: user.email,
        created: user.created,
        updated: user.updated,
      }
    )
    next()
  } catch (error) {
    return next(error)
  }
})

app.get(
  '/config',
  checkAccess,
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const currentUser = storage.get(request)
      return response.status(200).json(await getData(currentUser))
    } catch (error) {
      return next(error as Error)
    }
  },
)

app.post(
  '/login',
  async (request: Request, response: Response) => {
    try {
      const currentUser = await UsersService.login(request.body)
      return response.status(200).json(await getData(currentUser, false, true))
    } catch (error) {
      return response.status(400).send({ statusCode: 400, message: (error as Error).message })
    }
  },
)

app.post(
  '/users',
  async (request: Request, response: Response) => {
    try {
      const currentUser = await UsersService.create('User', request.body) as UserModel
      return response.status(200).json(await getData(currentUser, true, true))
    } catch (error) {
      return response.status(400).send({ statusCode: 400, message: (error as Error).message })
    }
  },
)

app.post(
  '/reminders',
  checkAccess,
  async (request: Request, response: Response) => {
    try {
      const currentUser = storage.get(request)
      const reminder = await BaseService.create('Reminder', request.body, currentUser)
      return response.send(reminder)
    } catch (error) {
      return response.status(400).send({ statusCode: 400, message: (error as Error).message })
    }
  },
)

app.put(
  '/reminders/:reminderId',
  checkAccess,
  async (request: Request, response: Response) => {
    try {
      const { reminderId } = request.params
      const currentUser = storage.get(request)
      if (new Date() < new Date(request.body.dateTime)) {
        request.body.isNotified = 0
        request.body.isChecked = 0
      }
      const reminder = await BaseService.update('Reminder', reminderId, request.body, currentUser)
      return response.send(reminder)
    } catch (error) {
      return response.status(500).send({ statusCode: 500, message: (error as Error).message })
    }
  },
)

app.delete(
  '/reminders/:reminderId',
  checkAccess,
  async (request: Request, response: Response) => {
    try {
      const { reminderId } = request.params
      const currentUser = storage.get(request)
      await BaseService.remove('Reminder', reminderId, currentUser)
      return response.send('Ok')
    } catch (error) {
      return response.status(500).send({ statusCode: 500, message: (error as Error).message })
    }
  },
)

app.post(
  '/users/push-token',
  checkAccess,
  async (request: Request, response: Response) => {
    try {
      const currentUser = storage.get(request)
      const user = await BaseService.findByField('User', 'id', currentUser.id) as UserModel
      const userPushTokens = JSON.parse(user.pushTokens || '[]')
      const pushToken = request.body.pushToken
      const existingToken = userPushTokens.find((token: string) => token === pushToken)
      if (!existingToken) {
        userPushTokens.push(pushToken)
        user.pushTokens = JSON.stringify(userPushTokens)
        await BaseService.update('User', currentUser.id, user)
      }

      return response.send('ok')
    } catch (error) {
      return response.status(400).send({ statusCode: 400, message: (error as Error).message })
    }
  },
)

app.delete(
  '/users/push-token',
  checkAccess,
  async (request: Request, response: Response) => {
    try {
      const currentUser = storage.get(request)
      const user = await BaseService.findByField('User', 'id', currentUser.id) as UserModel
      if (user.pushTokens) {
        let userPushTokens = JSON.parse(user.pushTokens)
        const pushToken = request.body.pushToken
        const existingToken = userPushTokens.find((token: string) => token === pushToken)
        if (existingToken) {
          userPushTokens = userPushTokens.filter((token: string) => token !== pushToken)
          user.pushTokens = JSON.stringify(userPushTokens)
          await BaseService.update('User', currentUser.id, user)
        }
      }

      return response.send('ok')
    } catch (error) {
      return response.status(400).send({ statusCode: 400, message: (error as Error).message })
    }
  },
)

const secondInMilliseconds = 1000
setInterval(async() => {
  const reminders = await BaseService.getList('Reminder', activeStatus, undefined, { isNotified: 0 }) as ReminderModel[]
  let secondsOffset
  reminders.forEach(async (reminder) => {
    const startDate = new Date(reminder.dateTime)
    secondsOffset = 300

    const secondsDifference = startDate.getTime() - new Date().getTime()
    if (secondsDifference > 0 && secondsDifference < secondsOffset * secondInMilliseconds) {
      const user = await BaseService.findByField('User', 'id', reminder.userId || '') as UserModel
      if (user?.pushTokens) {
        const pushTokens = JSON.parse(user.pushTokens)
        pushTokens.forEach((pushToken: string) => {
          admin.messaging().send({
            token: pushToken,
            data: {
              title: reminder.title,
              dateTime: reminder.dateTime.toString(),
              userId: String(user.id),
              entityId: String(reminder.id),
              entity: 'Reminder',
            },
          }) 
        })
        reminder.isNotified = true
        await BaseService.update('Reminder', String(reminder.id), reminder, user)
      }
    }
  })
}, 5000)
