const _ = require('lodash')
const mysql = require('he-mysql')
const request = require('request')
const Jssha = require('jssha')

/**
 * 配置项，token和ticket可以使用的秒数
 */
const seconds = 5400

/**
 * 获取accesstoken的包装方法
 * @param Object db 数据库连接池对象
 * @param String appid 微信公众号appid
 * @param String secret 微信公众号的appsecret
 */
var getToken = function (db, appid, secret) {
  return new Promise(function (resolve, reject) {
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
  return new Promise(function (resolve, reject) {
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
 * https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421141115&token=&lang=zh_CN
 * @param String ticket 已经取得的ticket对象
 * @param String url url字符串
 * @param String nonce 随机字符串
 * @param String timestamp 字符串类型的时间戳，注意，必须是字符串
 */
var getSign = function (ticket, url, nonce, timestamp) {
  var result = {
    ticket: ticket,
    nonceStr: nonce,
    timestamp: timestamp,
    url: url
  }
  var str = getObjString(result)
  var objsha = new Jssha('SHA-1', 'TEXT')
  objsha.update(str)
  result.signature = objsha.getHash('HEX')
  return result
}

/**
 * 取10位时间戳
 */
var getTime = function () {
  return _.now().toString().substr(0, 10)
}

/**
 * request promise
 * @param String url 需要访问的url
 */
var http = function (url) {
  return new Promise(function (resolve, reject) {
    request(url, function (err, resp, body) {
      if (err || resp.statusCode !== 200) {
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
var getObjString = function (args) {
  // 分解老对象排序后添加到新对象
  let keys = Object.keys(args)
  keys = keys.sort()
  let newArgs = {}
  keys.forEach(function (key) {
    newArgs[key.toLowerCase()] = args[key]
  })

  // 将对象制作成字符串并返回
  var str = ''
  for (var k in newArgs) {
    str += '&' + k + '=' + newArgs[k]
  }
  return str.substr(1)
}

/**
 * 取accesstoken
 * https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140183&token=&lang=zh_CN
 * @param Object db 连接mysql数据库时的配置项
 * @param String appid 微信公众号的appid
 * @param String secret 微信公众号的appsecret
 */
var getAccessToken = async function (db, appid, secret) {
  // 并取当前时间戳
  let timestamp = getTime()
  try {
    // 获取数据，如果缓存还在有效时间内，则直接返回data.token
    let data = await mysql.query(db, ['select * from `token` where id=1'], null)
    data = data[0][0]
    if ((data.time + seconds) > timestamp) {
      return {errcode: 0, access_token: data.token}
    }

    // 如果已经超时，则到微信端进行读取
    let resp = await http('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + secret)
    resp = JSON.parse(resp)
    if (resp.errcode === undefined) {
      await mysql.query(db, ['update `token` set `token`=?, `time`=? where id=1'], [resp.access_token, timestamp])
      return {errcode: 0, access_token: resp.access_token}
    }

    // 如果出现问题，则直接返回false
    return resp
  } catch (err) {
    throw err
  }
}

/**
 * 取api_ticket
 * https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421141115&token=&lang=zh_CN
 * @param Object db 数据库连接对象
 * @param String token 已经取回的token
 */
var getJSApiTicket = async function (db, token) {
  // 取当前时间戳
  let time = getTime()
  try {
    // 获取数据，如果缓存还在有效时间内，则直接返回data.ticket
    let data = await mysql.query(db, ['select * from `ticket` where id=1'], null)
    data = data[0][0]
    if (time - seconds > data.time) {
      return {errcode: 0, ticket: data.ticket}
    }

    // 如果已经超时，则到微信端进行读取
    let resp = await http('https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + token + '&type=wx_card')
    resp = JSON.parse(resp)
    if (resp.errcode === 0) {
      await mysql.query(db, ['update `ticket` set `ticket`=?, `time`=? where id=1'], [resp.ticket, time])
      return {errcode: 0, ticket: resp.ticket}
    }

    // 如果出现问题，则直接返回false
    return resp
  } catch (err) {
    throw err
  }
}

/**
 * 导出
 */
exports.getToken = getToken
exports.getTicket = getTicket
exports.getSign = getSign
