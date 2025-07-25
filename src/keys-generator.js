const { generateKeyPairSync } = require('crypto')

// Генерация пары ключей
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048, // длина ключа в битах
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
})

console.log('Публичный ключ:\n', publicKey)
console.log('Приватный ключ:\n', privateKey)

// Можно сохранить ключи в файлы
const fs = require('fs')
fs.writeFileSync('public.pem', publicKey)
fs.writeFileSync('private.pem', privateKey)