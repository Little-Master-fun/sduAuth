# 山东大学统一身份认证登入

这是调用山东大学统一身份认证的前端代码示例，主要运用了 vite 的代理服务器进行跨域问题解决。该配置仅用于开发端调试，如需上线服务端可运用 Nginx 的反向代理来完成，原理大致相同。

## 主要函数

主要函数是 src/ulits/authentication.js 中的 Auth (...) ，接受四个入参：

- usrData:{sduid: '',password: ''}；
- Success 成功时调用函数；
- Fail 密码错误时调用函数；
- Other 其他错误函数，默认为空。

```javascript
const Auth = async (usrData, Success, Fail, Other = () => {}) => {
  const sduid = usrData.sduid;
  const password = usrData.password;

  try {
    // 获取TGT票据
    const tgtResponse = await axios.post(
      "/aut",
      `username=${encodeURIComponent(sduid)}&password=${encodeURIComponent(
        password
      )}`
    );

    const ticket = tgtResponse.data;
    if (!ticket.startsWith("TGT-")) {
      throw new Error("认证失败，请检查账号密码");
    }

    // 获取ST票据
    const stResponse = await axios.post(
      `https://pass.sdu.edu.cn/cas/restlet/tickets/${ticket}`,
      "service=https://service.sdu.edu.cn/tp_up/view?m=up",
      { headers: { "Content-Type": "text/plain" } }
    );

    const sTicket = stResponse.data;
    if (!sTicket.startsWith("ST-")) {
      throw new Error("服务票据获取失败");
    }

    // 验证服务票据
    const validateResponse = await axios.get(
      "https://pass.sdu.edu.cn/cas/serviceValidate",
      {
        params: {
          ticket: sTicket,
          service: "https://service.sdu.edu.cn/tp_up/view?m=up",
        },
      }
    );

    // 使用正则解析XML响应
    const xmlText = validateResponse.data;
    const userNameMatch = xmlText.match(
      /<cas:USER_NAME>(.*?)<\/cas:USER_NAME>/
    );
    const studentIdMatch = xmlText.match(/<sso:user>(.*?)<\/sso:user>/);

    if (!userNameMatch || !studentIdMatch) {
      throw new Error("用户信息解析失败");
    }
  } catch (error) {
    //有点神奇的是这种方式账号秘密出错会返回400状态码，正确的时候会返回一个'Network Error'
    // 但服务端响应正确，所以这里通过这两种状态检测
    if (error.message == "Network Error") {
      //成功
      Success();
    } else if (error.status == 400) {
      //账号密码错误
      Fail();
      console.error(error);
    } else {
      //其他失败
      Other();
      console.error(error);
    }
  }
};
```

## vite.config.js 配置

配置代理服务器

```javascript
server:{
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/aut': {
        target: 'https://pass.sdu.edu.cn/cas/restlet/tickets',
        changeOrigin: true, //改变请求源
        secure: false,  // 不验证 HTTPS 证书
        rewrite: (path) => path.replace(/^\/aut/, '') //重写路径
      },
    },
  }
```

这里配置路径为 /aut 的请求都会被自动代理，依情况自行修改，记得同时修改 Auth（） 函数
