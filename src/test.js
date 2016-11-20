const {MYSQL} = require('./config')
const main = require('./main')


main.getAccessToken(MYSQL.TOKEN, 'wx6c6398aa27bba6c6', '1cff35124bd1875e17fc840682025077').then(
  function (token) {
    main.getJSApiTicket(token).then(
      function (result) {
        console.log(result)
      },
      function () {
        console.log('error')
      }
    )
  },
  function () {
    console.log('error')
  }
)


