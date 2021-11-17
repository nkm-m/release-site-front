import Vue from "vue";
import App from "./App.vue";
import axios from "axios";
import VueAxios from "vue-axios";
import store from "./store";
import Amplify, * as AmplifyModules from "aws-amplify";
import { AmplifyPlugin } from "aws-amplify-vue";
import aws_exports from "./aws-exports";
import AWS from "aws-sdk";
AWS.config.region = "ap-northeast-1";
AWS.config.apiVersions = {
  ec2: "2016-11-15",
  cloudformation: "2010-05-15"
};
Amplify.configure(aws_exports);
Vue.prototype.$project = "Study";
Vue.prototype.$masterInstanceName = "Master";
Vue.prototype.$stackName = "StudyRelease";
//ログイン関連の日本語化
const messageResource = {
  ja: {
    Username: "ユーザー名",
    "Enter your Username": "ユーザ名を入力",
    "Sign In": "ログイン",
    Password: "パスワード",
    "Enter your password": "パスワードを入力",
    "Forgot your password? ": "パスワードを忘れた場合",
    "Reset password": "パスワードリセット",
    "Back to Sign In": "ログインに戻る",
    "Sign in to your account": "ログイン",
    "Sign Out": "ログアウト",
    "Reset your password": "パスワードをリセット",
    "Send Code": "送信"
  }
};
AmplifyModules.I18n.putVocabularies(messageResource);
Vue.prototype.$notifySlack = async function(text, icon_emoji) {
  const payload = {
    username: `${this.$project} ReleaseSite Notification`,
    text,
    icon_emoji
  };
  await this.axios.post(
    "Slack Incoming Webhook url",
    JSON.stringify(payload)
  );
};
Vue.prototype.$disableButton = function(target) {
  for (let i = 0; i < target.length; i++) {
    const btn = document.getElementById(target[i]);
    btn.disabled = true;
    btn.style.cursor = "not-allowed";
  }
};
Vue.prototype.$enableButton = function(target) {
  for (let i = 0; i < target.length; i++) {
    const btn = document.getElementById(target[i]);
    btn.disabled = false;
    btn.style.cursor = "pointer";
  }
};
Vue.config.productionTip = false;
Vue.use(VueAxios, axios);
Vue.use(AmplifyPlugin, AmplifyModules);
new Vue({
  store,
  render: h => h(App)
}).$mount("#app");
