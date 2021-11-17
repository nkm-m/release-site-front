<template>
  <div id="modal">
    <div id="modal-content" class="modal">
      <p id="modal-message" class="modal__message">{{ confirmationMessage }}</p>
      <p>{{ target }}</p>
      <span id="modal-cansel" class="modal__cancel" @click="returnFalse()">
        キャンセル
      </span>
      <button class="modal__btn" @click="returnTrue()">はい</button>
    </div>
    <div id="modal-overlay"></div>
  </div>
</template>

<script>
export default {
  name: "Modal",
  props: ["confirmationMessage", "target", "methodName"],
  methods: {
    returnFalse() {
      this.$emit("execute-method", false, this.methodName);
    },
    returnTrue() {
      this.$emit("execute-method", true, this.methodName);
    }
  }
};
</script>

<style scoped>
.modal {
  padding: 10px 20px;
  border: 2px solid var(--base-color);
  background: var(--bg-color);
  z-index: 2;
  display: block;
  text-align: center;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 10px;
}

.modal__message {
  margin-top: 10px;
}

.modal__cancel {
  margin-right: 30px;
  font-size: 15px;
}

.modal__cancel:hover {
  cursor: pointer;
  color: rgb(14, 48, 240);
  font-weight: bold;
}

.modal__btn {
  display: inline-block;
  margin: 30px auto;
  text-decoration: none;
  width: 80px;
  height: 30px;
  text-decoration: none;
  color: #000000;
  border: solid 2px var(--base-color);
  border-radius: 3px;
  transition: 0.4s;
  text-align: center;
  vertical-align: middle;
  font-size: 15px;
  background-color: var(--bg-color);
}

.modal__btn:hover {
  background: var(--base-color);
  color: white;
  cursor: pointer;
}

#modal-overlay {
  z-index: 1;
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 120%;
  background-color: rgba(0, 0, 0, 0.75);
}
</style>
