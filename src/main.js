const _ = require('lodash')
const mysql = require('he-mysql')
const request = require('request')

/**
 * 配置项，token和ticket可以使用的秒数
 */
const seconds = 5400

/**
 * 获取accesstoken的包装方法
 */
var getToken = function (db, appid, secret) {
  return new Promise(function(resolve, reject) {
    getAccessToken(db, appid, secret).then(
      function (token) {
        resolve(token)
      },
      function (err) {
        reject(err)
      }
    )
  })
}

/**
 * 获取jsapiticket的包装方法
 */
var getTicket = function (token) {
  return new Promise(function(resolve, reject) {
    getJSApiTicket(token).then(
      function (ticket) {
        resolve(ticket)
      },
      function (err) {
        reject(err)
      }
    )
  })
}

/**
 * 取10位时间戳
 */
var getTime = function () {
  return _.now().toString().substr(0,10)
}

/**
 * request promise
 */
var http = function (url) {
  return new Promise(function(resolve, reject) {
    request(url, function (err, resp, body){
      if (err || resp.statusCode != 200) {
        reject('error')
      }
      resolve(body)
    })
  })
}

/**
 * 取accesstoken
 * @param Object db 连接mysql数据库时的配置项
 * @param String appid 微信公众号的appid
 * @param String secret 微信公众号的appsecret
 */
var getAccessToken = async function (db, appid, secret) {
  // 取时间戳，数据  
  let time = getTime()
  let data = await mysql.query(db, ['select * from `token` where id=1'], null)

  // 根据是否存在有效缓存进行操作
  if (time - seconds > data[0][0].time) {
    try {
      let body = await http('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + secret)
      body = JSON.parse(body)
      await mysql.query(db, ['update `token` set `token`=?, `time`=? where id=1'], [body.access_token, time])
      return body.access_token
    } catch (err) {
      throw err
    }
  } else {
    return data[0][0].token
  }
}

/**
 * 取api_ticket
 * @param String accesstoken 连接mysql数据库时的配置项
 */
var getJSApiTicket = async function (db, token) {
  let time = getTime()
  let data = await mysql.query(db, ['select * from `ticket` where id=1'], null)

  // 根据是否存在有效缓存进行操作
  if (time - seconds > data[0][0].time) {
    try {
      let body = await http('https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + token + '&type=wx_card')
      body = JSON.parse(body)
      await mysql.query(db, ['update `ticket` set `ticket`=?, `time`=? where id=1'], [body.ticket, time])
      return body.ticket
    } catch (err) {
      throw err
    }
  } else {
    return data[0][0].ticket
  }
}

/**
 * 导出
 */
exports.getToken = getToken
exports.getTicket = getTicket
