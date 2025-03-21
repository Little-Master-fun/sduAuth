<script setup>
import { ref } from "vue";
import { Auth } from "./ulits/authentication";

const usrData = ref({
  sduid: "",
  password: "",
});

const Fail = () => {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = `认证失败：账号秘密错误`;
  resultDiv.style.color = "red";
};
const Success = () => {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = `认证成功`;
  resultDiv.style.color = "green";
};

const login = async () => {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = `正在连接认证服务器...`;
  Auth(usrData.value, Success, Fail);
};
</script>

<template>
  <div
    style="
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    "
  >
    <h2>山东大学统一认证</h2>
    <div>
      <input
        type="text"
        id="sduid"
        placeholder="校园统一认证账号"
        style="width: 200px; margin: 5px"
        v-model="usrData.sduid"
      />
    </div>
    <div>
      <input
        type="password"
        id="password"
        placeholder="密码"
        style="width: 200px; margin: 5px"
        v-model="usrData.password"
      />
    </div>
    <button @click="login()" style="margin: 5px">登录</button>
    <div id="result" style="margin-top: 10px; color: #666"></div>
  </div>
</template>
