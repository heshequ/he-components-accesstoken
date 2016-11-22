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
async function fun () {
  try {
    // 取token
    let token = await main.getToken(MYSQL.TOKEN, 'wx6c6398aa27bba6c6', '1cff35124bd1875e17fc840682025077')
    if (parseInt(token.errcode) !== 0) {
      console.log('token err')
    }

    // 取ticket
    let ticket = await main.getTicket(MYSQL.TOKEN, token.access_token)
    if (parseInt(ticket.errcode) !== 0) {
      console.log('ticket err')
    }

    // 取sign
    let sign = main.getSign(ticket.ticket, 'http://www.baidu.com', '随机字符串', '1479636741')

    // 输出
    console.log(token.access_token)
    console.log(ticket.ticket)
    console.log(sign.signature)
  } catch (err) {
    console.log(err)
  }
}

fun()
