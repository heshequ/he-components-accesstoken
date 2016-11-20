const mysql = require('mysql')
const main = require('./main')

/**
 * mysql 数据库设置
 */
const MYSQL_DATABASE = {
  TOKEN: {
    host: 'localhost',
    user: 'root',
    password: 'Ac591234',
    database: 'he_wetoken'
  }
}

/**
 * mysql 连接池对象
 */
const MYSQL = {
  TOKEN: mysql.createPool(MYSQL_DATABASE.TOKEN)
}

/**
 * 模拟koa
 */
async function fun() {
  let token = await main.getToken(MYSQL.TOKEN, 'wx6c6398aa27bba6c6', '1cff35124bd1875e17fc840682025077')
  let ticket = await main.getTicket(MYSQL.TOKEN, token)
  let sign = main.getSign(ticket, 'http://www.baidu.com', '随机字符串', '1479636741')
  console.log(token)
  console.log(ticket)
  console.log(sign)
}

fun()