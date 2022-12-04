const axios = require('axios')
const random = require('random')
const hmacSHA256 = require('crypto-js/hmac-sha256')
const Hex = require('crypto-js/enc-hex')
const HttpsProxyAgent = require("https-proxy-agent")
const httpsAgent = new HttpsProxyAgent(`http://127.0.0.1:7890`)

const { APIKey, APISecretKey, totpSecret, password }  = require('./config.json')
const address = require('./address.js')

class OkxClient {
  constructor(key, secretKey) {
    this.instance = axios.create({
      proxy: false,
      httpsAgent,
      baseURL: 'https://www.okx.com/',
      timeout: 50000,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json; utf-8',
        'OK-ACCESS-KEY': key,
        // 'FTX-SUBACCOUNT': subaccount,
      }
    })

    // make signature
    this.instance.interceptors.request.use(
      config => {
        const now = Date.now()
        const method = config.method.toUpperCase()
        const { data, params } = config
        let sign = now + method

        config.headers['OK-ACCESS-TIMESTAMP'] = now
        config.headers['OK-ACCESS-PASSPHRASE'] = '123'

        switch (method) {
          case 'GET':
            // sign += `/api/${config.url}?${new URLSearchParams(params).toString()}`
            sign += `/${config.url}`
            break
          case 'POST':
            sign += `/${config.url}${JSON.stringify(data)}`
          }
        const signature = hmacSHA256(sign, secretKey).toString(Hex)
        config.headers['OK-ACCESS-SIGN'] = signature
        return config
      },
      err => Promise.reject(err)
    )
  }

  _get(endpoint, params = {}) {
    return this.instance
      .get(endpoint, { params })
      .then(res => console.log(res.data))
      .catch(e => console.log(e.toJSON()))
  }

  _post(endpoint, data = {}) {
    return this.instance.post(endpoint, data)
  }
  // https://www.okx.com/docs-v5/zh/#rest-api-funding-get-currencies
  withdraw(data) {
    return this._post('api/v5/asset/withdrawal', data)
  }

  getBalances() {
    return this._get('api/v5/asset/balances')
  }

}

const okxClient = new OkxClient(APIKey, APISecretKey)

// ;(async() => {
//   let timeInterval = 0
//   let times = []
//   for(let i = 0; i < address.length; i++) {
//     const randomTime = i === 0 ? 0 : random.int(6 * 60, 10 * 60)
//     times.push(randomTime)
//     timeInterval = timeInterval + randomTime

//     setTimeout(async() => {
//       const totpCode = authenticator.generate(totpSecret);
//       try {
//         const res = await okxClient.withdraw({
//           coin: 'USDC',
//           size: random.float(52, 59).toFixed(random.int(3, 5)),
//           address: address[i],
//           // tag: null,
//           method: 'matic',
//           password: password,
//           code: totpCode
//         })
//         console.log('🚀 ~ file: index.js ~ line 99 ~ res', res.data)
//         console.log('Now time:', new Date(), 'Next minutes:',i < times.length - 1 ? (times[i+1] / 60).toFixed(2) : '0', 'Number:', i + 1)
//         // sleep(timeInterval * 1000)
//       } catch (error) {
//         console.log('🚀 ~ file: index.js ~ line 101 ~ error', error)
//       }
//     }, timeInterval * 1000)
//   }
// })()


okxClient.getBalances()

