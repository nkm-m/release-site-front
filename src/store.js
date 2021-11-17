import Vue from "vue";
import Vuex from "vuex";
import { Auth } from "aws-amplify";
Vue.use(Vuex);
const store = new Vuex.Store({
  state: {
    credentials: undefined,
  },
  mutations: {
    setCredentials: async function(state, credentials) {
      state.credentials = credentials;
    }
  },
  actions: {
    async getCredentials({ commit }) {
      const credentials = await Auth.currentCredentials();
      commit("setCredentials", credentials);
    }
  }
});
export default store;
