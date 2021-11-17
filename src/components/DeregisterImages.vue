<template>
  <div class="main__container">
    <modal
      :confirmationMessage="confirmationMessage"
      :target="imageName"
      :method-name="methodName"
      v-show="modal"
      @execute-method="executeMethod"
    ></modal>

    <h3 class="main__container--heading">AMI削除</h3>

    <!-- AMI選択セレクトボックス -->
    <select
      id="deregister-image"
      class="main__container--select main__container--select-deregister-image"
    >
      <option hidden>AMIを選択</option>
      <option
        v-for="(image, i) in images"
        :key="i"
        :value="image.imageId"
        :disabled="image.disable"
        >{{ image.imageName }}</option
      >
    </select>

    <!-- 削除ボタン -->
    <button
      type="button"
      id="deregister-images-btn"
      class="main__container--btn main__container--deregister-btn"
      @click="
        showModal('下記のAMIを削除してもよろしいですか？'),
          (methodName = 'deregisterImages')
      "
    >
      AMI削除
    </button>

    <!-- 削除状況表示 -->
    <div>
      <span v-if="state === 'pending'">
        <img src="../assets/waiting.gif" class="main__container--waiting-img" />
      </span>
      <span
        :style="{ color }"
        class="main__container-deregister-images-message"
        >{{ deregistrationMessage }}</span
      >
    </div>
  </div>
</template>

<script>
import AWS from "aws-sdk";
import EC2 from "../ec2";
import Modal from "./Modal";
export default {
  name: "DeregisterImages",
  components: {
    Modal
  },
  data() {
    return {
      modal: false,
      imageName: "",
      imageId: "",
      state: "",
      confirmationMessage: "",
      methodName: "",
      deregistrationMessage: "",
      color: ""
    };
  },
  props: ["images"],
  methods: {
    /**
     * 入力チェックを行い、モーダルを表示するメソッド
     */
    showModal(message) {
      this.deregistrationMessage = "";
      const selectImage = document.getElementById("deregister-image");
      const selectedIndex = selectImage.selectedIndex;
      this.imageName = this.target = selectImage.options[selectedIndex].text;
      this.imageId = selectImage.value;
      if (this.imageName === "AMIを選択") {
        this.changeState("error", "AMIを選択してください。", "#ff0000");
        return;
      }
      this.confirmationMessage = message;
      this.modal = true;
    },
    /**
     * モーダルでの選択が「はい」だった場合に、対象メソッドを実行するメソッド
     */
    async executeMethod(yes, executeMethod) {
      this.modal = false;
      if (yes) {
        if (executeMethod === "deregisterImages") {
          await this.deregisterImages();
        }
      }
    },
    /**
     * AMIを削除(登録解除)するメソッド
     */
    async deregisterImages() {
      this.$disableButton(["deregister-images-btn"]);
      this.changeState("pending", "AMIを削除しています。", "#0064c8");

      try {
        const ec2 = new EC2(AWS, this.$store.state.credentials);
        const image = await ec2.describeImages(this.imageId);
        await ec2.deregisterImage(this.imageId);
        await ec2.deleteSnapshot(image.BlockDeviceMappings[0].Ebs.SnapshotId);

        this.changeState(
          "complete",
          `${this.imageName}のAMIを削除しました。`,
          "#00c800"
        );

        //AMI削除後に一覧からも対象のAMIを削除
        for (let i = 0; i < this.images.length; i++) {
          if (this.images[i].imageId === this.imageId) {
            this.images.splice(i, 1);
          }
        }
        this.$emit("new-images", this.images);

        //選択状態を初期化
        document.getElementById("deregister-image").selectedIndex = -1;
      } catch (err) {
        console.log(err);
        this.changeState(
          "error",
          `AMI削除中にエラーが発生しました。EC2コンソールでのAMIを確認してください。${err}`,
          "#ff0000"
        );
      }
      this.$enableButton(["deregister-images-btn"]);
    },
    /**
     * 処理状況と表示メッセージ、フォントカラーを変更するメソッド
     */
    changeState(state, message, color) {
      this.state = state;
      this.deregistrationMessage = message;
      this.color = color;
    }
  }
};
</script>

<style>
.main__container--select-deregister-image {
  margin: 25px 0;
  margin-bottom: 0;
}

.main__container--deregister-btn {
  margin: 30px auto;
}

.main__container-deregister-images-message {
  font-weight: bold;
}
</style>
