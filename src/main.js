const _ = require('lodash')
const mysql = require('he-mysql')
const request = require('request')
const jssha = require('jssha')

/**
 * 配置项，token和ticket可以使用的秒数
 */
const seconds = 3600

/**
 * 获取accesstoken的包装方法
 * @param Object db 数据库连接池对象
 * @param String appid 微信公众号appid
 * @param String secret 微信公众号的appsecret
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
 * @param Object db 数据库连接池对象
 * @param String token 已经取得的access_token字符串
 */
var getTicket = function (db, token) {
  return new Promise(function(resolve, reject) {
    getJSApiTicket(db, token).then(
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
 * 获取签名
 * @param String ticket 已经取得的ticket对象
 * @param String url url字符串
 * @param String nonce 随机字符串
 * @param String timestamp 字符串类型的时间戳，注意，必须是字符串
 */
var getSign = function (ticket, url, nonce, timestamp) {
  var ret = {
    ticket: ticket,
    nonceStr: nonce,
    timestamp: timestamp,
    url: url
  }
  var string = raw(ret)
  var jsSHA = require('jssha')
  var shaObj = new jsSHA('SHA-1', 'TEXT')  //new jsSHA(string, 'TEXT');
  shaObj.update(string)
  ret.signature = shaObj.getHash("HEX")  //shaObj.getHash('SHA-1', 'HEX');
  return ret
}

/**
 * 取10位时间戳
 */
var getTime = function () {
  return _.now().toString().substr(0,10)
}

/**
 * request promise
 * @param String url 需要访问的url
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
 * 制作签名前，整理args对象
 * @param Object args 需要整理的args对象
 */
var raw = function (args) {
  let keys = Object.keys(args)
  keys = keys.sort()
  let newArgs = {}
  keys.forEach(function (key) {
    newArgs[key.toLowerCase()] = args[key]
  })
  var string = ''
  for (var k in newArgs) {
    string += '&' + k + '=' + newArgs[k]
  }
  string = string.substr(1)
  return string
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
  if ((data[0][0].time + seconds) <= time ) {
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
 * @param Object db 数据库连接对象
 * @param String token 已经取回的token
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
exports.getSign = getSign
