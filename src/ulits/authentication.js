import axios from 'axios';

//入参数据
//usrData:{sduid: '',password: ''}，Success 成功时调用函数，Fail 密码错误时调用函数，Other 其他错误函数，默认为空
export const Auth = async(usrData, Success, Fail, Other = () => {} ) => {
    const sduid = usrData.sduid;
    const password = usrData.password;
  
    try {

      // 获取TGT票据
      const tgtResponse = await axios.post(
        '/aut',
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
      //有点神奇的是这种方式账号秘密出错会返回400状态码，正确的时候会返回一个'Network Error',但服务端响应正确，所以这里通过这两种状态检测
      if(error.message == 'Network Error'){
        Success()
      }else if(error.status == 400){
        Fail();
        console.error(error);
      }else{
        Other();
        console.error(error);
      }
    }
  }

